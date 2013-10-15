//     uuid.js
//
//     Copyright (c) 2010-2012 Robert Kieffer
//     MIT License - http://opensource.org/licenses/mit-license.php

(function() {
  var _global = this;

  // Unique ID creation requires a high quality random # generator.  We feature
  // detect to determine the best RNG source, normalizing to a function that
  // returns 128-bits of randomness, since that's what's usually required
  var _rng;

  // Node.js crypto-based RNG - http://nodejs.org/docs/v0.6.2/api/crypto.html
  //
  // Moderately fast, high quality
  if (typeof(require) == 'function') {
    try {
      var _rb = require('crypto').randomBytes;
      _rng = _rb && function() {return _rb(16);};
    } catch(e) {}
  }

  if (!_rng && _global.crypto && crypto.getRandomValues) {
    // WHATWG crypto-based RNG - http://wiki.whatwg.org/wiki/Crypto
    //
    // Moderately fast, high quality
    var _rnds8 = new Uint8Array(16);
    _rng = function whatwgRNG() {
      crypto.getRandomValues(_rnds8);
      return _rnds8;
    };
  }

  if (!_rng) {
    // Math.random()-based (RNG)
    //
    // If all else fails, use Math.random().  It's fast, but is of unspecified
    // quality.
    var  _rnds = new Array(16);
    _rng = function() {
      for (var i = 0, r; i < 16; i++) {
        if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
        _rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
      }

      return _rnds;
    };
  }

  // Buffer class to use
  var BufferClass = typeof(Buffer) == 'function' ? Buffer : Array;

  // Maps for number <-> hex string conversion
  var _byteToHex = [];
  var _hexToByte = {};
  for (var i = 0; i < 256; i++) {
    _byteToHex[i] = (i + 0x100).toString(16).substr(1);
    _hexToByte[_byteToHex[i]] = i;
  }

  // **`parse()` - Parse a UUID into it's component bytes**
  function parse(s, buf, offset) {
    var i = (buf && offset) || 0, ii = 0;

    buf = buf || [];
    s.toLowerCase().replace(/[0-9a-f]{2}/g, function(oct) {
      if (ii < 16) { // Don't overflow!
        buf[i + ii++] = _hexToByte[oct];
      }
    });

    // Zero out remaining bytes if string was short
    while (ii < 16) {
      buf[i + ii++] = 0;
    }

    return buf;
  }

  // **`unparse()` - Convert UUID byte array (ala parse()) into a string**
  function unparse(buf, offset) {
    var i = offset || 0, bth = _byteToHex;
    return  bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]];
  }

  // **`v1()` - Generate time-based UUID**
  //
  // Inspired by https://github.com/LiosK/UUID.js
  // and http://docs.python.org/library/uuid.html

  // random #'s we need to init node and clockseq
  var _seedBytes = _rng();

  // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
  var _nodeId = [
    _seedBytes[0] | 0x01,
    _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]
  ];

  // Per 4.2.2, randomize (14 bit) clockseq
  var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

  // Previous uuid creation time
  var _lastMSecs = 0, _lastNSecs = 0;

  // See https://github.com/broofa/node-uuid for API details
  function v1(options, buf, offset) {
    var i = buf && offset || 0;
    var b = buf || [];

    options = options || {};

    var clockseq = options.clockseq != null ? options.clockseq : _clockseq;

    // UUID timestamps are 100 nano-second units since the Gregorian epoch,
    // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
    // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
    // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
    var msecs = options.msecs != null ? options.msecs : new Date().getTime();

    // Per 4.2.1.2, use count of uuid's generated during the current clock
    // cycle to simulate higher resolution clock
    var nsecs = options.nsecs != null ? options.nsecs : _lastNSecs + 1;

    // Time since last uuid creation (in msecs)
    var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

    // Per 4.2.1.2, Bump clockseq on clock regression
    if (dt < 0 && options.clockseq == null) {
      clockseq = clockseq + 1 & 0x3fff;
    }

    // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
    // time interval
    if ((dt < 0 || msecs > _lastMSecs) && options.nsecs == null) {
      nsecs = 0;
    }

    // Per 4.2.1.2 Throw error if too many uuids are requested
    if (nsecs >= 10000) {
      throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
    }

    _lastMSecs = msecs;
    _lastNSecs = nsecs;
    _clockseq = clockseq;

    // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
    msecs += 12219292800000;

    // `time_low`
    var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
    b[i++] = tl >>> 24 & 0xff;
    b[i++] = tl >>> 16 & 0xff;
    b[i++] = tl >>> 8 & 0xff;
    b[i++] = tl & 0xff;

    // `time_mid`
    var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
    b[i++] = tmh >>> 8 & 0xff;
    b[i++] = tmh & 0xff;

    // `time_high_and_version`
    b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
    b[i++] = tmh >>> 16 & 0xff;

    // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
    b[i++] = clockseq >>> 8 | 0x80;

    // `clock_seq_low`
    b[i++] = clockseq & 0xff;

    // `node`
    var node = options.node || _nodeId;
    for (var n = 0; n < 6; n++) {
      b[i + n] = node[n];
    }

    return buf ? buf : unparse(b);
  }

  // **`v4()` - Generate random UUID**

  // See https://github.com/broofa/node-uuid for API details
  function v4(options, buf, offset) {
    // Deprecated - 'format' argument, as supported in v1.2
    var i = buf && offset || 0;

    if (typeof(options) == 'string') {
      buf = options == 'binary' ? new BufferClass(16) : null;
      options = null;
    }
    options = options || {};

    var rnds = options.random || (options.rng || _rng)();

    // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
    rnds[6] = (rnds[6] & 0x0f) | 0x40;
    rnds[8] = (rnds[8] & 0x3f) | 0x80;

    // Copy bytes to buffer, if provided
    if (buf) {
      for (var ii = 0; ii < 16; ii++) {
        buf[i + ii] = rnds[ii];
      }
    }

    return buf || unparse(rnds);
  }

  // Export public API
  var uuid = v4;
  uuid.v1 = v1;
  uuid.v4 = v4;
  uuid.parse = parse;
  uuid.unparse = unparse;
  uuid.BufferClass = BufferClass;

  if (_global.define && define.amd) {
    // Publish as AMD module
    define(function() {return uuid;});
  } else if (typeof(module) != 'undefined' && module.exports) {
    // Publish as node.js module
    module.exports = uuid;
  } else {
    // Publish as global (in browsers)
    var _previousRoot = _global.uuid;

    // **`noConflict()` - (browser only) to reset global 'uuid' var**
    uuid.noConflict = function() {
      _global.uuid = _previousRoot;
      return uuid;
    };

    _global.uuid = uuid;
  }
}).call(this);// Generated by CoffeeScript 1.4.0

/*

  http://schema.encapsule.org/schema.html

  A single-page HTML5 application for creating, visualizing, and editing
  JSON-encoded Soft Circuit Description Language (SCDL) models.

  Copyright 2013 Encapsule Project, Copyright 2013 Chris Russell

  Distributed under the terms of the Boost Software License Version 1.0
  See included license.txt or http://www.boost.org/LICENSE_1_0.txt

  Sources on GitHub: https://github.com/Encapsule-Project/schema

  Visit http://www.encapsule.org for more information and happy hacking.
*/


(function() {
  var ONMjs, namespaceEncapsule,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  namespaceEncapsule = (typeof Encapsule !== "undefined" && Encapsule !== null) && Encapsule || (this.Encapsule = {});

  Encapsule.code = (Encapsule.code != null) && Encapsule.code || (this.Encapsule.code = {});

  Encapsule.code.lib = (Encapsule.code.lib != null) && Encapsule.code.lib || (this.Encapsule.code.lib = {});

  Encapsule.code.lib.js = (Encapsule.code.lib.js != null) && Encapsule.code.lib.js || (this.Encapsule.code.lib.js = {});

  Encapsule.code.lib.js.clone = function(object_) {
    var flags, key, newInstance;
    try {
      if (!(object_ != null) || typeof object_ !== 'object') {
        return object_;
      }
      if (object_ instanceof Date) {
        return new Date(object_.getTime());
      }
      if (object_ instanceof RegExp) {
        flags = '';
        if (object_.global != null) {
          flags += 'g';
        }
        if (object_.ignoreCase != null) {
          flags += 'i';
        }
        if (object_.multiline != null) {
          flags += 'm';
        }
        if (object_.sticky != null) {
          flags += 'y';
        }
        return new RegExp(object_.source, flags);
      }
      newInstance = new object_.constructor();
      for (key in object_) {
        newInstance[key] = Encapsule.code.lib.js.clone(object_[key]);
      }
      return newInstance;
    } catch (exception) {
      return Console.message("Encapsule.code.lib.js.clone: " + exception);
    }
  };

  Encapsule.code.lib.js.dictionaryLength = function(dictionary_) {
    return Object.keys(dictionary_).length;
  };

  /*
  ------------------------------------------------------------------------------
  
  The MIT License (MIT)
  
  Copyright (c) 2013 Encapsule Project
    
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:
  
  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.
  
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
  
  **** Encapsule Project :: Build better software with circuit models ****
  
  OPEN SOURCES: http://github.com/Encapsule HOMEPAGE: http://Encapsule.org
  BLOG: http://blog.encapsule.org TWITTER: https://twitter.com/Encapsule
  
  ------------------------------------------------------------------------------
  
  
  
  ------------------------------------------------------------------------------
  */


  namespaceEncapsule = (typeof Encapsule !== "undefined" && Encapsule !== null) && Encapsule || (this.Encapsule = {});

  Encapsule.code = (Encapsule.code != null) && Encapsule.code || (this.Encapsule.code = {});

  Encapsule.code.lib = (Encapsule.code.lib != null) && Encapsule.code.lib || (this.Encapsule.code.lib = {});

  Encapsule.code.lib.onm = (Encapsule.code.lib.onm != null) && Encapsule.code.lib.onm || (this.Encapsule.code.lib.onm = {});

  ONMjs = Encapsule.code.lib.onm;

  ONMjs.implementation = (ONMjs.implementation != null) && ONMjs.implementation || (ONMjs.implementation = {});

  ONMjs.implementation.ModelDetails = (function() {

    function ModelDetails(model_, objectModelDeclaration_) {
      var buildOMDescriptorFromLayout,
        _this = this;
      try {
        this.model = ((model_ != null) && model_) || (function() {
          throw "Internal error missing model input parameter.";
        })();
        buildOMDescriptorFromLayout = function(ONMD_, path_, parentDescriptor_, componentDescriptor_, parentPathIdVector_, parentPathExtensionPointIdVector_) {
          var archetypeDescriptor, componentDescriptor, description, id, label, namespaceProperties, namespaceType, objectModelDescriptorReference, parentPathExtensionPoints, path, pathReference, processArchetypeDeclaration, subNamespace, tag, thisDescriptor, updatedParentPathExtensionPointIdVector, _i, _len, _ref;
          try {
            if (!((ONMD_ != null) && ONMD_)) {
              throw "Missing object model layout object input parameter! If you specified the namespace declaration via object reference, check the validity of the reference.";
            }
            if (!((ONMD_.jsonTag != null) && ONMD_.jsonTag)) {
              throw "Missing required namespace declaration property 'jsonTag'.";
            }
            tag = (ONMD_.jsonTag != null) && ONMD_.jsonTag || (function() {
              throw "Namespace declaration missing required `jsonTag` property.";
            })();
            path = (path_ != null) && path_ && ("" + path_ + "." + tag) || tag;
            label = (ONMD_.____label != null) && ONMD_.____label || "<no label provided>";
            description = (ONMD_.____description != null) && ONMD_.____description || "<no description provided>";
            id = _this.countDescriptors++;
            namespaceType = ((ONMD_.namespaceType != null) && ONMD_.namespaceType) || (!id && (ONMD_.namespaceType = "root")) || (function() {
              throw "Internal error unable to determine namespace type.";
            })();
            parentPathExtensionPoints = void 0;
            if ((parentPathExtensionPointIdVector_ != null) && parentPathExtensionPointIdVector_) {
              parentPathExtensionPoints = Encapsule.code.lib.js.clone(parentPathExtensionPointIdVector_);
            } else {
              parentPathExtensionPoints = [];
            }
            namespaceProperties = (ONMD_.namespaceProperties != null) && ONMD_.namespaceProperties || {};
            thisDescriptor = _this.objectModelDescriptorById[id] = {
              "archetypePathId": -1,
              "children": [],
              "componentNamespaceIds": [],
              "description": description,
              "extensionPointReferenceIds": [],
              "id": id,
              "idComponent": id,
              "isComponent": false,
              "jsonTag": tag,
              "label": label,
              "namespaceType": namespaceType,
              "namespaceModelDeclaration": ONMD_,
              "namespaceModelPropertiesDeclaration": namespaceProperties,
              "parent": parentDescriptor_,
              "parentPathExtensionPoints": parentPathExtensionPoints,
              "parentPathIdVector": [],
              "path": path
            };
            _this.objectModelPathMap[path] = thisDescriptor;
            if ((parentDescriptor_ != null) && parentDescriptor_) {
              parentDescriptor_.children.push(thisDescriptor);
              thisDescriptor.parentPathIdVector = Encapsule.code.lib.js.clone(parentDescriptor_.parentPathIdVector);
              thisDescriptor.parentPathIdVector.push(parentDescriptor_.id);
            }
            if (_this.rankMax < thisDescriptor.parentPathIdVector.length) {
              _this.rankMax = thisDescriptor.parentPathIdVector.length;
            }
            componentDescriptor = void 0;
            switch (namespaceType) {
              case "extensionPoint":
                if (!((componentDescriptor_ != null) && componentDescriptor_)) {
                  throw "Internal error: componentDescriptor_ should be defined.";
                }
                thisDescriptor.idComponent = componentDescriptor_.id;
                componentDescriptor = componentDescriptor_;
                componentDescriptor.extensionPoints[path] = thisDescriptor;
                processArchetypeDeclaration = void 0;
                archetypeDescriptor = void 0;
                if ((ONMD_.componentArchetype != null) && ONMD_.componentArchetype) {
                  processArchetypeDeclaration = true;
                  archetypeDescriptor = ONMD_.componentArchetype;
                } else if ((ONMD_.componentArchetypePath != null) && ONMD_.componentArchetypePath) {
                  processArchetypeDeclaration = false;
                  pathReference = ONMD_.componentArchetypePath;
                  objectModelDescriptorReference = _this.objectModelPathMap[pathReference];
                  if (!((objectModelDescriptorReference != null) && objectModelDescriptorReference)) {
                    throw "Extension point namespace '" + path + "' component archetype '" + pathReference + "' was not found and is invalid.";
                  }
                  if (objectModelDescriptorReference.namespaceType !== "component") {
                    throw "Extension point namespace '" + path + "' declares component archetype '" + pathReference + "' which is not a 'component' namespace type.";
                  }
                  objectModelDescriptorReference.extensionPointReferenceIds.push(thisDescriptor.id);
                  thisDescriptor.archetypePathId = objectModelDescriptorReference.id;
                  _this.countExtensionReferences++;
                } else {
                  throw "Cannot process extension point declaration because its corresponding extension archetype is missing from the object model declaration.";
                }
                updatedParentPathExtensionPointIdVector = Encapsule.code.lib.js.clone(parentPathExtensionPoints);
                updatedParentPathExtensionPointIdVector.push(id);
                _this.countExtensionPoints++;
                if (processArchetypeDeclaration) {
                  buildOMDescriptorFromLayout(archetypeDescriptor, path, thisDescriptor, componentDescriptor, thisDescriptor.parentPathIdVector, updatedParentPathExtensionPointIdVector);
                }
                break;
              case "component":
                thisDescriptor.isComponent = true;
                thisDescriptor.extensionPoints = {};
                parentDescriptor_.archetypePathId = id;
                componentDescriptor = thisDescriptor;
                _this.countExtensions++;
                _this.countComponents++;
                break;
              case "root":
                if ((componentDescriptor_ != null) || componentDescriptor) {
                  throw "Internal error: componentDescriptor_ should be undefined.";
                }
                thisDescriptor.isComponent = true;
                thisDescriptor.extensionPoints = {};
                componentDescriptor = thisDescriptor;
                _this.countComponents++;
                break;
              case "child":
                if (!((componentDescriptor_ != null) && componentDescriptor_)) {
                  throw "Internal error: componentDescriptor_ should be defined.";
                }
                thisDescriptor.idComponent = componentDescriptor_.id;
                componentDescriptor = componentDescriptor_;
                _this.countChildren++;
                break;
              default:
                throw "Unrecognized namespace type '" + namespaceType + "' in object model namespace declaration.";
            }
            _this.objectModelDescriptorById[thisDescriptor.idComponent].componentNamespaceIds.push(thisDescriptor.id);
            if (!((ONMD_.subNamespaces != null) && ONMD_.subNamespaces)) {
              return true;
            }
            _ref = ONMD_.subNamespaces;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              subNamespace = _ref[_i];
              buildOMDescriptorFromLayout(subNamespace, path, thisDescriptor, componentDescriptor, thisDescriptor.parentPathIdVector, parentPathExtensionPoints);
            }
            return true;
          } catch (exception) {
            throw "ONMjs.implementation.ModelDetails.buildOMDescriptorFromLayout fail: " + exception;
          }
        };
        this.getNamespaceDescriptorFromPathId = function(pathId_) {
          var objectModelDescriptor;
          try {
            if (!(pathId_ != null)) {
              throw "Missing path ID parameter!";
            }
            if ((pathId_ < 0) || (pathId_ >= _this.objectModelDescriptorById.length)) {
              throw "Out of range path ID '" + pathId_ + " cannot be resolved.";
            }
            objectModelDescriptor = _this.objectModelDescriptorById[pathId_];
            if (!((objectModelDescriptor != null) && objectModelDescriptor)) {
              throw "Internal error getting namespace descriptor for path ID=" + pathId_ + "!";
            }
            return objectModelDescriptor;
          } catch (exception) {
            throw "ONMjs.implementation.ModelDetails.getNamespaceDescriptorFromPathId failure: " + exception;
          }
        };
        this.getNamespaceDescriptorFromPath = function(path_) {
          try {
            return _this.getNamespaceDescriptorFromPathId(_this.getPathIdFromPath(path_));
          } catch (exception) {
            throw "ONMjs.implementation.ModelDetails.getNamespaceDescriptorFromPath failure: " + exception;
          }
        };
        this.getPathIdFromPath = function(path_) {
          var objectModelDescriptor, objectModelPathId;
          try {
            if (!((path_ != null) && path_)) {
              throw "Missing object model path parameter!";
            }
            objectModelDescriptor = _this.objectModelPathMap[path_];
            if (!((objectModelDescriptor != null) && objectModelDescriptor)) {
              throw "Invalid object model path '" + objectModelPath_ + "' cannot be resolved.";
            }
            objectModelPathId = objectModelDescriptor.id;
            if (!(objectModelPathId != null)) {
              throw "Internal error: Invalid object model descriptor doesn't support id property for path '" + objectModelPath_ + ".";
            }
            return objectModelPathId;
          } catch (exception) {
            throw "ONMjs.implementation.ModelDetails.getPathIdFromPath fail: " + exception;
          }
        };
        this.getPathFromPathId = function(pathId_) {
          var objectModelDescriptor, path;
          try {
            objectModelDescriptor = _this.getNamespaceDescriptorFromPathId(pathId_);
            if (!((objectModelDescriptor != null) && objectModelDescriptor)) {
              throw "Internal error: Can't find object descriptor for valid path ID '" + pathId_ + ".";
            }
            path = objectModelDescriptor.path;
            if (!((path != null) && path)) {
              throw "Internal error: Invalid object model descriptor doesn't support path property for path '" + objectModelPath_ + ".";
            }
            return path;
          } catch (exception) {
            throw "ONMjs.implementation.ModelDetails.getPathFromPathId fail: " + exception;
          }
        };
        this.createAddressFromPathId = function(pathId_) {
          var descriptor, newAddress, parentPathId, pathIds, targetDescriptor, token, _i, _len;
          try {
            if (!(pathId_ != null)) {
              throw "Missing path input parameter.";
            }
            targetDescriptor = this.getNamespaceDescriptorFromPathId(pathId_);
            newAddress = new ONMjs.Address(this.model);
            token = void 0;
            pathIds = Encapsule.code.lib.js.clone(targetDescriptor.parentPathIdVector);
            pathIds.push(targetDescriptor.id);
            for (_i = 0, _len = pathIds.length; _i < _len; _i++) {
              parentPathId = pathIds[_i];
              descriptor = this.getNamespaceDescriptorFromPathId(parentPathId);
              if (descriptor.namespaceType === "component") {
                newAddress.implementation.pushToken(token);
              }
              token = new ONMjs.AddressToken(this.model, descriptor.idExtensionPoint, void 0, descriptor.id);
            }
            newAddress.implementation.pushToken(token);
            return newAddress;
          } catch (exception) {
            throw "ONMjs.implementation.ModelDetails.getAddressFromPathId failure: " + exception;
          }
        };
        if (!((objectModelDeclaration_ != null) && objectModelDeclaration_)) {
          throw "Missing object model delcaration input parameter!";
        }
        if (!((objectModelDeclaration_.jsonTag != null) && objectModelDeclaration_.jsonTag)) {
          throw "Missing required root namespace property 'jsonTag'.";
        }
        this.model.jsonTag = objectModelDeclaration_.jsonTag;
        this.model.label = (objectModelDeclaration_.____label != null) && objectModelDeclaration_.____label || "<no label provided>";
        this.model.description = (objectModelDeclaration_.____description != null) && objectModelDeclaration_.____description || "<no description provided>";
        this.objectModelDeclaration = Encapsule.code.lib.js.clone(objectModelDeclaration_);
        Object.freeze(this.objectModelDeclaration);
        if (!((this.objectModelDeclaration != null) && this.objectModelDeclaration)) {
          throw "Failed to deep copy (clone) source object model declaration.";
        }
        this.objectModelPathMap = {};
        this.objectModelDescriptorById = [];
        this.countDescriptors = 0;
        this.countComponents = 0;
        this.countExtensionPoints = 0;
        this.countExtensions = 0;
        this.countExtensionReferences = 0;
        this.countChildren = 0;
        this.rankMax = 0;
        buildOMDescriptorFromLayout(objectModelDeclaration_);
        if (this.countExtensionPoints !== this.countExtensions + this.countExtensionReferences) {
          throw "Layout declaration error: extension point and extension descriptor counts do not match. countExtensionPoints=" + this.countExtensionPoints + " countExtensions=" + this.countExtensions;
        }
        if (this.countComponents !== this.countExtensionPoints + 1 - this.countExtensionReferences) {
          throw "Layout declaration error: component count should be " + ("extension count + 1 - extension references. componentCount=" + this.countComponents + " ") + (" countExtensions=" + this.countExtensions + " extensionReferences=" + this.countExtensionReferences);
        }
        Object.freeze(this.objectModelPathMap);
        Object.freeze(this.objectModelDescriptorById);
      } catch (exception) {
        throw "ONMjs.implementation.ModelDetails failure: " + exception;
      }
    }

    return ModelDetails;

  })();

  ONMjs.Model = (function() {

    function Model(objectModelDeclaration_) {
      var _this = this;
      try {
        this.implementation = new ONMjs.implementation.ModelDetails(this, objectModelDeclaration_);
        this.createRootAddress = function() {
          try {
            return new ONMjs.Address(_this, [new ONMjs.AddressToken(_this, void 0, void 0, 0)]);
          } catch (exception) {
            throw "ONMjs.Model.getRootAddress failure: " + exception;
          }
        };
        this.createPathAddress = function(path_) {
          var newAddress, pathId;
          try {
            pathId = _this.implementation.getPathIdFromPath(path_);
            newAddress = _this.implementation.createAddressFromPathId(pathId);
            return newAddress;
          } catch (exception) {
            throw "ONMjs.Model.getAddressFromPath failure: " + exception;
          }
        };
        this.getSemanticBindings = function() {
          try {
            return _this.implementation.objectModelDeclaration.semanticBindings;
          } catch (exception) {
            throw "ONMjs.Model.getSemanticBindings failure: " + exception;
          }
        };
        this.isEqual = function(model_) {
          try {
            return _this.jsonTag === model_.jsonTag;
          } catch (exception) {
            throw "ONMjs.Model.isEqual failure: " + exception;
          }
        };
      } catch (exception) {
        throw "ONMjs.Model construction fail: " + exception;
      }
    }

    return Model;

  })();

  /*
  ------------------------------------------------------------------------------
  
  The MIT License (MIT)
  
  Copyright (c) 2013 Encapsule Project
    
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:
  
  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.
  
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
  
  **** Encapsule Project :: Build better software with circuit models ****
  
  OPEN SOURCES: http://github.com/Encapsule HOMEPAGE: http://Encapsule.org
  BLOG: http://blog.encapsule.org TWITTER: https://twitter.com/Encapsule
  
  ------------------------------------------------------------------------------
  
  
  
  ------------------------------------------------------------------------------
  */


  namespaceEncapsule = (typeof Encapsule !== "undefined" && Encapsule !== null) && Encapsule || (this.Encapsule = {});

  Encapsule.code = (Encapsule.code != null) && Encapsule.code || (this.Encapsule.code = {});

  Encapsule.code.lib = (Encapsule.code.lib != null) && Encapsule.code.lib || (this.Encapsule.code.lib = {});

  Encapsule.code.lib.onm = (Encapsule.code.lib.onm != null) && Encapsule.code.lib.onm || (this.Encapsule.code.lib.onm = {});

  ONMjs = Encapsule.code.lib.onm;

  ONMjs.implementation = (ONMjs.implementation != null) && ONMjs.implementation || (ONMjs.implementation = {});

  ONMjs.implementation.AddressDetails = (function() {

    function AddressDetails(address_, model_, tokenVector_) {
      var token, _i, _len, _ref,
        _this = this;
      try {
        this.address = ((address_ != null) && address_) || (function() {
          throw "Internal error missing address input parameter.";
        })();
        this.model = ((model_ != null) && model_) || (function() {
          throw "Internal error missing model input paramter.";
        })();
        this.getModelPath = function() {
          var lastToken;
          try {
            if (!_this.tokenVector.length) {
              throw "Invalid address contains no address tokens.";
            }
            lastToken = _this.getLastToken();
            return lastToken.namespaceDescriptor.path;
          } catch (exception) {
            throw "ONMjs.implementation.AddressDetails.getModelPathFromAddress failure: " + exception;
          }
        };
        this.getModelDescriptorFromSubpath = function(subpath_) {
          var path;
          try {
            path = "" + (_this.getModelPath()) + "." + subpath_;
            return _this.model.implementation.getNamespaceDescriptorFromPath(path);
          } catch (exception) {
            throw "ONMjs.implementation.AddressDetails.getModelDescriptorFromSubpath failure: " + exception;
          }
        };
        this.createSubpathIdAddress = function(pathId_) {
          var addressedComponentDescriptor, addressedComponentToken, newAddress, newToken, newTokenVector, targetNamespaceDescriptor;
          try {
            if (!((pathId_ != null) && pathId_ > -1)) {
              throw "Missing namespace path ID input parameter.";
            }
            addressedComponentToken = _this.getLastToken();
            addressedComponentDescriptor = addressedComponentToken.componentDescriptor;
            targetNamespaceDescriptor = _this.model.implementation.getNamespaceDescriptorFromPathId(pathId_);
            if (targetNamespaceDescriptor.idComponent !== addressedComponentDescriptor.id) {
              throw "Invalid path ID specified does not resolve to a namespace in the same component as the source address.";
            }
            newToken = new ONMjs.AddressToken(_this.model, addressedComponentToken.idExtensionPoint, addressedComponentToken.key, pathId_);
            newTokenVector = _this.tokenVector.length > 0 && _this.tokenVector.slice(0, _this.tokenVector.length - 1) || [];
            newTokenVector.push(newToken);
            newAddress = new ONMjs.Address(_this.model, newTokenVector);
            return newAddress;
          } catch (exception) {
            throw "ONMjs.implementation.AddressDetails.createSubpathIdAddress failure: " + exception;
          }
        };
        this.pushToken = function(token_) {
          var parentToken;
          try {
            if (_this.tokenVector.length) {
              parentToken = _this.tokenVector[_this.tokenVector.length - 1];
              _this.validateTokenPair(parentToken, token_);
            }
            _this.tokenVector.push(token_.clone());
            if (token_.componentDescriptor.id === 0) {
              _this.complete = true;
            }
            if (token_.keyRequired) {
              _this.keysRequired = true;
            }
            if (!token_.isQualified()) {
              _this.keysSpecified = false;
            }
            _this.humanReadableString = void 0;
            _this.hashString = void 0;
            return _this.address;
          } catch (exception) {
            throw "ONMjs.implementation.AddressDetails.pushToken failure: " + exception;
          }
        };
        this.validateTokenPair = function(parentToken_, childToken_) {
          try {
            if (!((parentToken_ != null) && parentToken_ && (childToken_ != null) && childToken_)) {
              throw "Internal error: input parameters are not correct.";
            }
            if (!childToken_.keyRequired) {
              throw "Child token is invalid because it specifies a namespace in the root component.";
            }
            if (parentToken_.namespaceDescriptor.id !== childToken_.extensionPointDescriptor.id) {
              throw "Child token is invalid because the parent token does not select the required extension point namespace.";
            }
            if (!parentToken_.isQualified() && childToken_.isQualified()) {
              throw "Child token is invalid because the parent token is unqualified and the child is qualified.";
            }
            return true;
          } catch (exception) {
            throw "ONMjs.implementation.AddressDetails.validateTokenPair the specified parent and child tokens are incompatible and cannot be used to form an address: " + exception;
          }
        };
        this.getLastToken = function() {
          try {
            if (!_this.tokenVector.length) {
              throw "Illegal call to getLastToken on uninitialized address class instance.";
            }
            return _this.tokenVector[_this.tokenVector.length - 1];
          } catch (exception) {
            throw "ONMjs.implementation.AddressDetails.getLastToken failure: " + exception;
          }
        };
        this.getDescriptor = function() {
          try {
            return _this.getLastToken().namespaceDescriptor;
          } catch (exception) {
            throw "ONMjs.implementation.AddressDetails.getDescriptor failure: " + exception;
          }
        };
        this.tokenVector = [];
        this.parentExtensionPointId = -1;
        this.complete = false;
        this.keysRequired = false;
        this.keysSpecified = true;
        _ref = (tokenVector_ != null) && tokenVector_ || [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          token = _ref[_i];
          this.pushToken(token);
        }
        this.parentAddressesAscending = void 0;
        this.parentAddressesDescending = void 0;
        this.subnamespaceAddressesAscending = void 0;
        this.subnamespaceAddressesDescending = void 0;
        this.subcomponentAddressesAscending = void 0;
        this.subcomponentsAddressesDescending = void 0;
        this.humanReadableString = void 0;
        this.hashString = void 0;
      } catch (exception) {
        throw "ONMjs.implementation.AddressDetails failure: " + exception;
      }
    }

    return AddressDetails;

  })();

  ONMjs.Address = (function() {

    function Address(model_, tokenVector_) {
      this.visitExtensionPointAddresses = __bind(this.visitExtensionPointAddresses, this);

      this.visitChildAddresses = __bind(this.visitChildAddresses, this);

      this.visitSubaddressesDescending = __bind(this.visitSubaddressesDescending, this);

      this.visitSubaddressesAscending = __bind(this.visitSubaddressesAscending, this);

      this.visitParentAddressesDescending = __bind(this.visitParentAddressesDescending, this);

      this.visitParentAddressesAscending = __bind(this.visitParentAddressesAscending, this);

      this.getPropertiesModel = __bind(this.getPropertiesModel, this);

      this.getModel = __bind(this.getModel, this);

      this.createSubcomponentAddress = __bind(this.createSubcomponentAddress, this);

      this.createComponentAddress = __bind(this.createComponentAddress, this);

      this.createSubpathAddress = __bind(this.createSubpathAddress, this);

      this.createParentAddress = __bind(this.createParentAddress, this);

      this.clone = __bind(this.clone, this);

      this.isEqual = __bind(this.isEqual, this);

      this.isRoot = __bind(this.isRoot, this);

      this.getHashString = __bind(this.getHashString, this);

      this.getHumanReadableString = __bind(this.getHumanReadableString, this);

      var _this = this;
      try {
        this.model = (model_ != null) && model_ || (function() {
          throw "Missing required object model input parameter.";
        })();
        this.implementation = new ONMjs.implementation.AddressDetails(this, model_, tokenVector_);
        this.isComplete = function() {
          return _this.implementation.complete;
        };
        this.isQualified = function() {
          return !_this.implementation.keysRequired || _this.implementation.keysSpecified;
        };
        this.isResolvable = function() {
          return _this.isComplete() && _this.isQualified();
        };
        this.isCreatable = function() {
          return _this.isComplete() && _this.implementation.keysRequired && !_this.implementation.keysSpecified;
        };
      } catch (exception) {
        throw "ONMjs.Address error: " + exception;
      }
    }

    Address.prototype.getHumanReadableString = function() {
      var humanReadableString, index, token, _i, _len, _ref;
      try {
        if ((this.implementation.humanReadableString != null) && this.implementation.humanReadableString) {
          return this.implementation.humanReadableString;
        }
        index = 0;
        humanReadableString = "";
        _ref = this.implementation.tokenVector;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          token = _ref[_i];
          if (!index) {
            humanReadableString += "" + token.model.jsonTag + ".";
          }
          if ((token.key != null) && token.key) {
            humanReadableString += "." + token.key + ".";
          } else {
            if (token.idExtensionPoint > 0) {
              humanReadableString += ".";
            }
          }
          humanReadableString += "" + token.idNamespace;
          index++;
        }
        this.implementation.humanReadableString = humanReadableString;
        return humanReadableString;
      } catch (exception) {
        throw "ONMjs.Address.getHumanReadableString failure: " + exception;
      }
    };

    Address.prototype.getHashString = function() {
      var humanReadableString;
      try {
        if ((this.implementation.hashString != null) && this.implementation.hashString) {
          return this.implementation.hashString;
        }
        humanReadableString = this.getHumanReadableString();
        this.implementation.hashString = encodeURIComponent(humanReadableString).replace(/[!'()]/g, escape).replace(/\*/g, "%2A");
        return this.implementation.hashString;
      } catch (exception) {
        throw "ONMjs.Address.getHashString failure: " + exception;
      }
    };

    Address.prototype.isRoot = function() {
      try {
        return this.implementation.getLastToken().idNamespace === 0;
      } catch (exception) {
        throw "CNMjs.Address.isRoot failure: " + exception;
      }
    };

    Address.prototype.isEqual = function(address_) {
      var index, result, tokenA, tokenB;
      try {
        if (!((address_ != null) && address_)) {
          throw "Missing address input parameter.";
        }
        if (this.implementation.tokenVector.length !== address_.implementation.tokenVector.length) {
          return false;
        }
        result = true;
        index = 0;
        while (index < this.implementation.tokenVector.length) {
          tokenA = this.implementation.tokenVector[index];
          tokenB = address_.implementation.tokenVector[index];
          if (!tokenA.isEqual(tokenB)) {
            result = false;
            break;
          }
          index++;
        }
        return result;
      } catch (exception) {
        throw "ONMjs.Address.isEqual failure: " + exception;
      }
    };

    Address.prototype.clone = function() {
      try {
        return new ONMjs.Address(this.model, this.implementation.tokenVector);
      } catch (exception) {
        throw "ONMjs.Address.clone failure: " + exception;
      }
    };

    Address.prototype.createParentAddress = function(generations_) {
      var descriptor, generations, newAddress, newTokenVector, token, tokenSourceIndex;
      try {
        if (!this.implementation.tokenVector.length) {
          throw "Invalid address contains no address tokens.";
        }
        generations = (generations_ != null) && generations_ || 1;
        tokenSourceIndex = this.implementation.tokenVector.length - 1;
        token = this.implementation.tokenVector[tokenSourceIndex--];
        if (token.namespaceDescriptor.id === 0) {
          return void 0;
        }
        while (generations) {
          descriptor = token.namespaceDescriptor;
          if (descriptor.id === 0) {
            break;
          }
          if (descriptor.namespaceType !== "component") {
            token = new ONMjs.AddressToken(token.model, token.idExtensionPoint, token.key, descriptor.parent.id);
          } else {
            token = (tokenSourceIndex !== -1) && this.implementation.tokenVector[tokenSourceIndex--] || (function() {
              throw "Internal error: exhausted token stack.";
            })();
          }
          generations--;
        }
        newTokenVector = ((tokenSourceIndex < 0) && []) || this.implementation.tokenVector.slice(0, tokenSourceIndex + 1);
        newAddress = new ONMjs.Address(token.model, newTokenVector);
        newAddress.implementation.pushToken(token);
        return newAddress;
      } catch (exception) {
        throw "ONMjs.Address.createParentAddress failure: " + exception;
      }
    };

    Address.prototype.createSubpathAddress = function(subpath_) {
      var baseDescriptor, baseDescriptorHeight, baseTokenVector, descriptor, newAddress, pathId, subpathDescriptor, subpathDescriptorHeight, subpathParentIdVector, token, _i, _len;
      try {
        if (!((subpath_ != null) && subpath_)) {
          throw "Missing subpath input parameter.";
        }
        subpathDescriptor = this.implementation.getModelDescriptorFromSubpath(subpath_);
        baseDescriptor = this.implementation.getDescriptor();
        if ((baseDescriptor.namespaceType === "extensionPoint") && (subpathDescriptor.namespaceType !== "component")) {
          throw "Invalid subpath string must begin with the name of the component contained by the base address' extension point.";
        }
        baseDescriptorHeight = baseDescriptor.parentPathIdVector.length;
        subpathDescriptorHeight = subpathDescriptor.parentPathIdVector.length;
        if ((subpathDescriptorHeight - baseDescriptorHeight) < 1) {
          throw "Internal error due to failed consistency check.";
        }
        subpathParentIdVector = subpathDescriptor.parentPathIdVector.slice(baseDescriptorHeight + 1, subpathDescriptorHeight);
        subpathParentIdVector.push(subpathDescriptor.id);
        baseTokenVector = this.implementation.tokenVector.slice(0, this.implementation.tokenVector.length - 1) || [];
        newAddress = new ONMjs.Address(this.model, baseTokenVector);
        token = this.implementation.getLastToken().clone();
        for (_i = 0, _len = subpathParentIdVector.length; _i < _len; _i++) {
          pathId = subpathParentIdVector[_i];
          descriptor = this.model.implementation.getNamespaceDescriptorFromPathId(pathId);
          switch (descriptor.namespaceType) {
            case "component":
              newAddress.implementation.pushToken(token);
              token = new ONMjs.AddressToken(token.model, token.namespaceDescriptor.id, void 0, pathId);
              break;
            default:
              token = new ONMjs.AddressToken(token.model, token.idExtensionPoint, token.key, pathId);
          }
        }
        newAddress.implementation.pushToken(token);
        return newAddress;
      } catch (exception) {
        throw "ONMjs.Address.createSubpathAddress failure: " + exception;
      }
    };

    Address.prototype.createComponentAddress = function() {
      var descriptor, newAddress;
      try {
        descriptor = this.implementation.getDescriptor();
        if (descriptor.isComponent) {
          return this.clone();
        }
        newAddress = this.implementation.createSubpathIdAddress(descriptor.idComponent);
        return newAddress;
      } catch (exception) {
        throw "ONMjs.Address.createComponentAddress failure: " + exception;
      }
    };

    Address.prototype.createSubcomponentAddress = function() {
      var descriptor, newToken;
      try {
        descriptor = this.implementation.getDescriptor();
        if (descriptor.namespaceType !== "extensionPoint") {
          throw "Unable to determine subcomponent to create because this address does not specifiy an extension point namespace.";
        }
        newToken = new ONMjs.AddressToken(this.model, descriptor.id, void 0, descriptor.archetypePathId);
        return this.clone().implementation.pushToken(newToken);
      } catch (exception) {
        throw "ONMjs.Address.createSubcomponentAddress failure: " + exception;
      }
    };

    Address.prototype.getModel = function() {
      try {
        return this.implementation.getDescriptor().namespaceModelDeclaration;
      } catch (exception) {
        throw "ONMjs.Address.getModel failure: " + exception;
      }
    };

    Address.prototype.getPropertiesModel = function() {
      try {
        return this.implementation.getDescriptor().namespaceModelPropertiesDeclaration;
      } catch (exception) {
        throw "ONMjs.Address.getPropertiesModel failure: " + exception;
      }
    };

    Address.prototype.visitParentAddressesAscending = function(callback_) {
      var address, _i, _len, _ref,
        _this = this;
      try {
        if (!((callback_ != null) && callback_)) {
          return false;
        }
        if (!((this.parentAddressesAscending != null) && this.parentAddressesAscending)) {
          this.parentAddressesAscending = [];
          this.visitParentAddressesDescending(function(address__) {
            _this.parentAddressesAscending.push(address__);
            return true;
          });
          this.parentAddressesAscending.reverse();
        }
        if (!this.parentAddressesAscending.length) {
          return false;
        }
        _ref = this.parentAddressesAscending;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          address = _ref[_i];
          try {
            callback_(address);
          } catch (exception) {
            throw "Failure occurred inside your registered callback function implementation: " + exception;
          }
        }
        return true;
      } catch (exception) {
        throw "ONMjs.Address.visitParentAddressesAscending failure: " + exception;
      }
    };

    Address.prototype.visitParentAddressesDescending = function(callback_) {
      var address, parent, _i, _len, _ref;
      try {
        if (!((callback_ != null) && callback_)) {
          return false;
        }
        if (!((this.parentAddressesDesending != null) && this.parentAddressesDesceding)) {
          this.parentAddressesDescending = [];
          parent = this.createParentAddress();
          while (parent) {
            this.parentAddressesDescending.push(parent);
            parent = parent.createParentAddress();
          }
        }
        if (!this.parentAddressesDescending.length) {
          return false;
        }
        _ref = this.parentAddressesDescending;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          address = _ref[_i];
          try {
            callback_(address);
          } catch (exception) {
            throw "Failure occurred inside your registered callback function implementation: " + exception;
          }
        }
        return true;
      } catch (exception) {
        throw "ONMjs.Address.visitParentAddressesDescending failure: " + exception;
      }
    };

    Address.prototype.visitSubaddressesAscending = function(callback_) {
      var address, namespaceDescriptor, subnamespaceAddress, subnamespacePathId, _i, _j, _len, _len1, _ref, _ref1;
      try {
        if (!((callback_ != null) && callback_)) {
          return false;
        }
        if (!((this.subnamespaceAddressesAscending != null) && this.subnamespaceAddressesAscending)) {
          this.subnamespaceAddressesAscending = [];
          namespaceDescriptor = this.implementation.getDescriptor();
          _ref = namespaceDescriptor.componentNamespaceIds;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            subnamespacePathId = _ref[_i];
            subnamespaceAddress = this.implementation.createSubpathIdAddress(subnamespacePathId);
            this.subnamespaceAddressesAscending.push(subnamespaceAddress);
          }
        }
        _ref1 = this.subnamespaceAddressesAscending;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          address = _ref1[_j];
          try {
            callback_(address);
          } catch (exception) {
            throw "Failure occurred inside your registered callback function implementation: " + exception;
          }
        }
        return true;
      } catch (exception) {
        throw "ONMjs.Address.visitSubaddressesAscending failure: " + exception;
      }
    };

    Address.prototype.visitSubaddressesDescending = function(callback_) {
      var address, _i, _len, _ref,
        _this = this;
      try {
        if (!(callback_ && callback_)) {
          return false;
        }
        if (!((this.subnamespaceAddressesDescending != null) && this.subnamespaceAddressesDescending)) {
          this.subnamespaceAddressesDescending = [];
          this.visitSubaddressesAscending(function(address__) {
            return _this.subnamespaceAddressesDescending.push(address__);
          });
          this.subnamespaceAddressesDescending.reverse();
        }
        _ref = this.subnamespaceAddressesDescending;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          address = _ref[_i];
          try {
            callback_(address);
          } catch (exception) {
            throw "Failure occurred inside your registered callback function implementation: " + exception;
          }
        }
        return true;
      } catch (exception) {
        throw "ONMjs.Address.visitSubaddressesAscending failure: " + exception;
      }
    };

    Address.prototype.visitChildAddresses = function(callback_) {
      var childAddress, childDescriptor, namespaceDescriptor, _i, _len, _ref;
      try {
        if (!((callback_ != null) && callback_)) {
          return false;
        }
        namespaceDescriptor = this.implementation.getDescriptor();
        _ref = namespaceDescriptor.children;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          childDescriptor = _ref[_i];
          childAddress = this.implementation.createSubpathIdAddress(childDescriptor.id);
          try {
            callback_(childAddress);
          } catch (exception) {
            throw "Failure occurred inside your registered callback function implementation: " + exception;
          }
        }
        return true;
      } catch (exception) {
        throw "ONMjs.Address.visitChildAddresses failure: " + exception;
      }
    };

    Address.prototype.visitExtensionPointAddresses = function(callback_) {
      var address, extensionPointAddress, extensionPointDescriptor, namespaceDescriptor, path, _i, _len, _ref, _ref1;
      try {
        if (!((callback_ != null) && callback_)) {
          return false;
        }
        if (!((this.extensionPointAddresses != null) && this.extensionPointAddresses)) {
          this.extensionPointAddresses = [];
          namespaceDescriptor = this.implementation.getDescriptor();
          _ref = namespaceDescriptor.extensionPoints;
          for (path in _ref) {
            extensionPointDescriptor = _ref[path];
            extensionPointAddress = this.implementation.createSubpathIdAddress(extensionPointDescriptor.id);
            this.extensionPointAddresses.push(extensionPointAddress);
          }
        }
        _ref1 = this.extensionPointAddresses;
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          address = _ref1[_i];
          callback_(address);
        }
        return true;
      } catch (exception) {
        throw "ONMjs.Address.visitExtensionPointAddresses failure: " + exception;
      }
    };

    return Address;

  })();

  /*
  ------------------------------------------------------------------------------
  
  The MIT License (MIT)
  
  Copyright (c) 2013 Encapsule Project
    
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:
  
  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.
  
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
  
  **** Encapsule Project :: Build better software with circuit models ****
  
  OPEN SOURCES: http://github.com/Encapsule HOMEPAGE: http://Encapsule.org
  BLOG: http://blog.encapsule.org TWITTER: https://twitter.com/Encapsule
  
  ------------------------------------------------------------------------------
  
  
  
  ------------------------------------------------------------------------------
  */


  namespaceEncapsule = (typeof Encapsule !== "undefined" && Encapsule !== null) && Encapsule || (this.Encapsule = {});

  Encapsule.code = (Encapsule.code != null) && Encapsule.code || (this.Encapsule.code = {});

  Encapsule.code.lib = (Encapsule.code.lib != null) && Encapsule.code.lib || (this.Encapsule.code.lib = {});

  Encapsule.code.lib.onm = (Encapsule.code.lib.onm != null) && Encapsule.code.lib.onm || (this.Encapsule.code.lib.onm = {});

  ONMjs = Encapsule.code.lib.onm;

  ONMjs.implementation = (ONMjs.implementation != null) && ONMjs.implementation || (ONMjs.implementation = {});

  ONMjs.implementation.binding = (ONMjs.implementation.binding != null) && ONMjs.implementation.binding || (ONMjs.implementation.binding = {});

  ONMjs.implementation.binding.InitializeNamespaceProperties = function(data_, descriptor_) {
    var functions, memberName, _ref, _ref1;
    try {
      if (!((data_ != null) && data_)) {
        throw "Missing data reference input parameter.";
      }
      if (!((descriptor_ != null) && descriptor_)) {
        throw "Missing descriptor input parameter.";
      }
      if ((descriptor_.userImmutable != null) && descriptor_.userImmutable) {
        _ref = descriptor_.userImmutable;
        for (memberName in _ref) {
          functions = _ref[memberName];
          if ((functions.fnCreate != null) && functions.fnCreate) {
            data_[memberName] = functions.fnCreate();
          }
        }
      }
      if ((descriptor_.userMutable != null) && descriptor_.userMutable) {
        _ref1 = descriptor_.userMutable;
        for (memberName in _ref1) {
          functions = _ref1[memberName];
          if ((functions.fnCreate != null) && functions.fnCreate) {
            data_[memberName] = functions.fnCreate();
          }
        }
      }
      return true;
    } catch (exception) {
      throw "ONMjs.implementation.binding.InitializeNamespaceProperties failure " + exception + ".";
    }
  };

  ONMjs.implementation.binding.VerifyNamespaceProperties = function(data_, descriptor_) {
    var functions, memberName, memberReference, _ref, _ref1;
    try {
      if (!((data_ != null) && data_)) {
        throw "Missing data reference input parameter.";
      }
      if (!((descriptor_ != null) && descriptor_)) {
        throw "Missing descriptor input parameter.";
      }
      if ((descriptor_.userImmutable != null) && descriptor_.userImmutable) {
        _ref = descriptor_.userImmutable;
        for (memberName in _ref) {
          functions = _ref[memberName];
          memberReference = data_[memberName];
          if (!(memberReference != null)) {
            throw "Expected immutable member '" + memberName + "' not found.";
          }
        }
      }
      if ((descriptor_.userMutable != null) && descriptor_.userMutable) {
        _ref1 = descriptor_.userMutable;
        for (memberName in _ref1) {
          functions = _ref1[memberName];
          memberReference = data_[memberName];
          if (!(memberReference != null)) {
            throw "Expected mutable member '" + memberName + "' not found.";
          }
        }
      }
      return true;
    } catch (exception) {
      throw "ONMjs.implementation.binding.VerifyNamespaceMembers failure " + exception + ".";
    }
  };

  ONMjs.implementation.binding.InitializeComponentNamespaces = function(store_, data_, descriptor_, extensionPointId_, key_) {
    var childDescriptor, resolveResults, _i, _len, _ref;
    try {
      if (!((data_ != null) && data_)) {
        throw "Missing data reference input parameter.";
      }
      if (!((descriptor_ != null) && descriptor_)) {
        throw "Missing descriptor input parameter.";
      }
      if (!((extensionPointId_ != null) && extensionPointId_)) {
        throw "Missing extension point ID input parameter.";
      }
      _ref = descriptor_.children;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        childDescriptor = _ref[_i];
        if (childDescriptor.namespaceType !== "component") {
          resolveResults = ONMjs.implementation.binding.ResolveNamespaceDescriptor({}, store_, data_, childDescriptor, key_, "new");
          ONMjs.implementation.binding.InitializeComponentNamespaces(store_, resolveResults.dataReference, childDescriptor, extensionPointId_, key_);
        }
      }
      return true;
    } catch (exception) {
      throw "ONMjs.implementation.binding.InitializeComponentNamespaces failure: " + exception + ".";
    }
  };

  ONMjs.implementation.binding.VerifyComponentNamespaces = function(store_, data_, descriptor_, extensionPointId_) {
    try {
      if (!((data_ != null) && data_)) {
        throw "Missing data reference input parameter.";
      }
      if (!((descriptor_ != null) && descriptor_)) {
        throw "Missing descriptor input parameter.";
      }
      return true;
    } catch (exception) {
      throw "ONMjs.implementation.binding.VerifyComponentNamespaces failure: " + exception + ".";
    }
  };

  ONMjs.implementation.binding.ResolveNamespaceDescriptor = function(resolveActions_, store_, data_, descriptor_, key_, mode_) {
    var jsonTag, newData, resolveResults;
    try {
      if (!((resolveActions_ != null) && resolveActions_)) {
        throw "Internal error: missing resolve actions structure input parameter.";
      }
      if (!((data_ != null) && data_)) {
        throw "Internal error: missing parent data reference input parameter.";
      }
      if (!((descriptor_ != null) && descriptor_)) {
        throw "Internal error: missing object model descriptor input parameter.";
      }
      if (!((mode_ != null) && mode_)) {
        throw "Internal error: missing mode input parameter.";
      }
      jsonTag = ((descriptor_.namespaceType !== "component") && descriptor_.jsonTag) || key_ || void 0;
      resolveResults = {
        jsonTag: jsonTag,
        dataReference: (jsonTag != null) && jsonTag && data_[jsonTag] || void 0,
        dataParentReference: data_,
        key: key_,
        mode: mode_,
        descriptor: descriptor_,
        store: store_,
        created: false
      };
      switch (mode_) {
        case "bypass":
          if (!((resolveResults.dataReference != null) && resolveResults.dataReference)) {
            throw "Internal error: Unable to resolve " + descriptor_.namespaceType + " namespace descriptor in bypass mode.";
          }
          break;
        case "new":
          if ((resolveResults.dataReference != null) && resolveResults.dataReference) {
            break;
          }
          newData = {};
          ONMjs.implementation.binding.InitializeNamespaceProperties(newData, descriptor_.namespaceModelPropertiesDeclaration);
          if (descriptor_.namespaceType === "component") {
            if (!((resolveActions_.getUniqueKey != null) && resolveActions_.getUniqueKey)) {
              throw "In order to create new components at runtime you must define the semanticBindings.getUniqueKey function in your data model declaration object.";
            }
            resolveResults.key = resolveResults.jsonTag = resolveActions_.getUniqueKey(newData);
            if (!((resolveResults.key != null) && resolveResults.key)) {
              throw "Unable to obtain key for new data component from function semanticBindings.getUniqueKey.";
            }
          }
          resolveResults.dataReference = resolveResults.dataParentReference[resolveResults.jsonTag] = newData;
          resolveResults.created = true;
          break;
        case "strict":
          if (!((resolveResult.dataReference != null) && resolveResult.dataReference)) {
            throw "Internal error: Unable to resolve  " + descriptor_.namespaceType + " namespace descriptor in strict mode.";
          }
          ONMjs.implementation.binding.VerifyNamespaceProperties(result.dataReference, descriptor_.namespaceModelPropertiesDeclaration);
          break;
        default:
          throw "Unrecognized mode parameter value.";
      }
      return resolveResults;
    } catch (exception) {
      throw "ONMjs.implementation.binding.ResolveNamespaceDescriptor failure: " + exception;
    }
  };

  ONMjs.implementation.AddressTokenBinder = (function() {

    function AddressTokenBinder(store_, parentDataReference_, token_, mode_) {
      var descriptor, extensionPointId, generations, getUniqueKeyFunction, model, parentPathIds, pathId, resolveActions, resolveResults, semanticBindings, targetComponentDescriptor, targetNamespaceDescriptor, _i, _len;
      try {
        this.store = (store_ != null) && store_ || (function() {
          throw "Missing object store input parameter.";
        })();
        model = store_.model;
        this.parentDataReference = (parentDataReference_ != null) && parentDataReference_ || (function() {
          throw "Missing parent data reference input parameter.";
        })();
        if (!((token_ != null) && token_)) {
          throw "Missing object model address token object input parameter.";
        }
        if (!((mode_ != null) && mode_)) {
          throw "Missing mode input parameter.";
        }
        this.dataReference = void 0;
        this.resolvedToken = token_.clone();
        targetNamespaceDescriptor = token_.namespaceDescriptor;
        targetComponentDescriptor = token_.componentDescriptor;
        semanticBindings = model.getSemanticBindings();
        getUniqueKeyFunction = (semanticBindings != null) && semanticBindings && (semanticBindings.getUniqueKey != null) && semanticBindings.getUniqueKey || void 0;
        resolveActions = {
          getUniqueKey: getUniqueKeyFunction
        };
        resolveResults = ONMjs.implementation.binding.ResolveNamespaceDescriptor(resolveActions, store_, this.parentDataReference, token_.componentDescriptor, token_.key, mode_);
        this.dataReference = resolveResults.dataReference;
        if (resolveResults.created) {
          this.resolvedToken.key = resolveResults.key;
        }
        extensionPointId = (token_.extensionPointDescriptor != null) && token_.extensionPointDescriptor && token_.extensionPointDescriptor.id || -1;
        if (mode_ === "new" && resolveResults.created) {
          ONMjs.implementation.binding.InitializeComponentNamespaces(store_, this.dataReference, targetComponentDescriptor, extensionPointId, this.resolvedToken.key);
        }
        if (mode_ === "strict") {
          ONMjs.implementation.binding.VerifyComponentNamespaces(store_, resolveResult.dataReference, targetComponentDescriptor, extensionPointId);
        }
        if (targetNamespaceDescriptor.isComponent) {
          return;
        }
        generations = targetNamespaceDescriptor.parentPathIdVector.length - targetComponentDescriptor.parentPathIdVector.length - 1;
        parentPathIds = generations && targetNamespaceDescriptor.parentPathIdVector.slice(-generations) || [];
        for (_i = 0, _len = parentPathIds.length; _i < _len; _i++) {
          pathId = parentPathIds[_i];
          descriptor = model.implementation.getNamespaceDescriptorFromPathId(pathId);
          resolveResults = ONMjs.implementation.binding.ResolveNamespaceDescriptor(resolveActions, store_, resolveResults.dataReference, descriptor, resolveResults.key, mode_);
        }
        resolveResults = ONMjs.implementation.binding.ResolveNamespaceDescriptor(resolveActions, store_, resolveResults.dataReference, targetNamespaceDescriptor, resolveResults.key, mode_);
        this.dataReference = resolveResults.dataReference;
        return;
      } catch (exception) {
        throw "ONMjs.implementation.AddressTokenBinder failure: " + exception;
      }
    }

    return AddressTokenBinder;

  })();

  /*
  ------------------------------------------------------------------------------
  
  The MIT License (MIT)
  
  Copyright (c) 2013 Encapsule Project
    
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:
  
  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.
  
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
  
  **** Encapsule Project :: Build better software with circuit models ****
  
  OPEN SOURCES: http://github.com/Encapsule HOMEPAGE: http://Encapsule.org
  BLOG: http://blog.encapsule.org TWITTER: https://twitter.com/Encapsule
  
  ------------------------------------------------------------------------------
  
  
  
  ------------------------------------------------------------------------------
  */


  namespaceEncapsule = (typeof Encapsule !== "undefined" && Encapsule !== null) && Encapsule || (this.Encapsule = {});

  Encapsule.code = (Encapsule.code != null) && Encapsule.code || (this.Encapsule.code = {});

  Encapsule.code.lib = (Encapsule.code.lib != null) && Encapsule.code.lib || (this.Encapsule.code.lib = {});

  Encapsule.code.lib.onm = (Encapsule.code.lib.onm != null) && Encapsule.code.lib.onm || (this.Encapsule.code.lib.onm = {});

  ONMjs = Encapsule.code.lib.onm;

  ONMjs.AddressToken = (function() {

    function AddressToken(model_, idExtensionPoint_, key_, idNamespace_) {
      this.isRoot = __bind(this.isRoot, this);

      this.isQualified = __bind(this.isQualified, this);

      this.isEqual = __bind(this.isEqual, this);

      this.clone = __bind(this.clone, this);
      try {
        this.model = (model_ != null) && model_ || (function() {
          throw "Missing object model input parameter.";
        })();
        if (!(idNamespace_ != null)) {
          throw "Missing target namespace ID input parameter.";
        }
        this.idNamespace = idNamespace_;
        this.namespaceDescriptor = model_.implementation.getNamespaceDescriptorFromPathId(idNamespace_);
        this.idComponent = this.namespaceDescriptor.idComponent;
        this.componentDescriptor = model_.implementation.getNamespaceDescriptorFromPathId(this.idComponent);
        this.key = (this.componentDescriptor.id > 0) && (key_ != null) && key_ || void 0;
        this.keyRequired = false;
        this.idExtensionPoint = (idExtensionPoint_ != null) && idExtensionPoint_ || -1;
        this.extensionPointDescriptor = void 0;
        if (this.componentDescriptor.id === 0) {
          return;
        }
        this.keyRequired = true;
        if (this.idExtensionPoint === -1 && !this.componentDescriptor.extensionPointReferenceIds.length) {
          this.idExtensionPoint = this.componentDescriptor.parent.id;
        }
        if (!this.idExtensionPoint) {
          throw "You must specify the ID of the parent extension point when creating a token addressing a '" + this.componentDescriptor.path + "' component namespace.";
        }
        this.extensionPointDescriptor = this.model.implementation.getNamespaceDescriptorFromPathId(this.idExtensionPoint);
        if (!((this.extensionPointDescriptor != null) && this.extensionPointDescriptor)) {
          throw "Internal error: unable to resolve extension point object model descriptor in request.";
        }
        if (this.extensionPointDescriptor.namespaceType !== "extensionPoint") {
          throw "Invalid selector key object specifies an invalid parent extension point ID. Not an extension point.";
        }
        if (this.extensionPointDescriptor.archetypePathId !== this.componentDescriptor.id) {
          throw "Invalid selector key object specifies unsupported extension point / component ID pair.";
        }
        return;
      } catch (exception) {
        throw "ONMjs.AddressToken failure: " + exception;
      }
    }

    AddressToken.prototype.clone = function() {
      return new ONMjs.AddressToken(this.model, (this.extensionPointDescriptor != null) && this.extensionPointDescriptor && this.extensionPointDescriptor.id || -1, this.key, this.namespaceDescriptor.id);
    };

    AddressToken.prototype.isEqual = function(token_) {
      var result;
      try {
        if (!((token_ != null) && token_)) {
          throw "Missing token input parameter.";
        }
        result = (this.idNamespace === token_.idNamespace) && (this.key === token_.key) && (this.idExtensionPoint === token_.idExtensionPoint);
        return result;
      } catch (exception) {
        throw "ONMjs.AddressToken.isEqual failure: " + exception;
      }
    };

    AddressToken.prototype.isQualified = function() {
      return !this.keyRequired || ((this.key != null) && this.key) || false;
    };

    AddressToken.prototype.isRoot = function() {
      return !this.componentId;
    };

    return AddressToken;

  })();

  /*
  ------------------------------------------------------------------------------
  
  The MIT License (MIT)
  
  Copyright (c) 2013 Encapsule Project
    
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:
  
  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.
  
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
  
  **** Encapsule Project :: Build better software with circuit models ****
  
  OPEN SOURCES: http://github.com/Encapsule HOMEPAGE: http://Encapsule.org
  BLOG: http://blog.encapsule.org TWITTER: https://twitter.com/Encapsule
  
  ------------------------------------------------------------------------------
  
  
  
  ------------------------------------------------------------------------------
  */


  namespaceEncapsule = (typeof Encapsule !== "undefined" && Encapsule !== null) && Encapsule || (this.Encapsule = {});

  Encapsule.code = (Encapsule.code != null) && Encapsule.code || (this.Encapsule.code = {});

  Encapsule.code.lib = (Encapsule.code.lib != null) && Encapsule.code.lib || (this.Encapsule.code.lib = {});

  Encapsule.code.lib.onm = (Encapsule.code.lib.onm != null) && Encapsule.code.lib.onm || (this.Encapsule.code.lib.onm = {});

  ONMjs = Encapsule.code.lib.onm;

  ONMjs.Namespace = (function() {

    function Namespace(store_, address_, mode_) {
      this.visitExtensionPointSubcomponents = __bind(this.visitExtensionPointSubcomponents, this);

      this.update = __bind(this.update, this);

      this.toJSON = __bind(this.toJSON, this);

      this.data = __bind(this.data, this);

      this.getResolvedLabel = __bind(this.getResolvedLabel, this);

      this.getResolvedAddress = __bind(this.getResolvedAddress, this);

      var address, addressToken, componentAddress, extensionPointAddress, extensionPointNamespace, mode, objectModel, objectModelNameKeys, objectModelNameStore, resolvedAddress, tokenBinder, _i, _len, _ref,
        _this = this;
      try {
        if (!((store_ != null) && store_)) {
          throw "Missing object store input parameter.";
        }
        this.store = store_;
        address = void 0;
        if (!((address_ != null) && address_ && address_.implementation.tokenVector.length)) {
          objectModel = store_.model;
          address = new ONMjs.Address(objectModel, [new ONMjs.AddressToken(objectModel, void 0, void 0, 0)]);
        } else {
          address = address_;
        }
        objectModelNameStore = store_.model.jsonTag;
        objectModelNameKeys = address.model.jsonTag;
        if (objectModelNameStore !== objectModelNameKeys) {
          throw "You cannot access a '" + objectModelNameStore + "' store namespace with a '" + objectModelNameKeys + "' object model address!";
        }
        if (!address.isComplete()) {
          throw "Specified address is invalid because the first address token does not specify the object store's root component.";
        }
        mode = (mode_ != null) && mode_ || "bypass";
        if ((mode !== "new") && !address.isResolvable()) {
          throw "Specified address is unresolvable in " + mode + " mode.";
        }
        this.dataReference = (store_.dataReference != null) && store_.dataReference || (function() {
          throw "Cannot resolve object store's root data reference.";
        })();
        this.resolvedTokenArray = [];
        this.getResolvedToken = function() {
          return _this.resolvedTokenArray.length && _this.resolvedTokenArray[_this.resolvedTokenArray.length - 1] || void 0;
        };
        _ref = address.implementation.tokenVector;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          addressToken = _ref[_i];
          tokenBinder = new ONMjs.implementation.AddressTokenBinder(store_, this.dataReference, addressToken, mode);
          this.resolvedTokenArray.push(tokenBinder.resolvedToken);
          this.dataReference = tokenBinder.dataReference;
          if (mode === "new") {
            if (addressToken.idComponent) {
              if (!((addressToken.key != null) && addressToken.key)) {
                resolvedAddress = new ONMjs.Address(this.store.model, this.resolvedTokenArray);
                componentAddress = resolvedAddress.createComponentAddress();
                this.store.reifier.reifyStoreComponent(componentAddress);
                extensionPointAddress = componentAddress.createParentAddress();
                extensionPointNamespace = this.store.openNamespace(extensionPointAddress);
                extensionPointNamespace.update();
              }
            }
          }
          true;
        }
        this.resolvedAddress = void 0;
      } catch (exception) {
        throw "ONMjs.Namespace failure: " + exception;
      }
    }

    Namespace.prototype.getResolvedAddress = function() {
      try {
        if ((this.resolvedAddress != null) && this.resolvedAddress) {
          return this.resolvedAddress;
        }
        this.resolvedAddress = new ONMjs.Address(this.store.model, this.resolvedTokenArray);
        return this.resolvedAddress;
      } catch (exception) {
        throw "ONMjs.Namespace.address failure: " + exception;
      }
    };

    Namespace.prototype.getResolvedLabel = function() {
      var getLabelBinding, resolvedDescriptor, resolvedLabel, semanticBindings;
      try {
        resolvedDescriptor = this.getResolvedToken().namespaceDescriptor;
        semanticBindings = this.store.model.getSemanticBindings();
        getLabelBinding = (semanticBindings != null) && semanticBindings && (semanticBindings.getLabel != null) && semanticBindings.getLabel || void 0;
        resolvedLabel = void 0;
        if ((getLabelBinding != null) && getLabelBinding) {
          resolvedLabel = getLabelBinding(this.data(), resolvedDescriptor);
        } else {
          resolvedLabel = resolvedDescriptor.label;
        }
        return resolvedLabel;
      } catch (exception) {
        throw "ONMjs.Namespace.getResolvedLabel failure: " + exception;
      }
    };

    Namespace.prototype.data = function() {
      return this.dataReference;
    };

    Namespace.prototype.toJSON = function(replacer_, space_) {
      var namespaceDescriptor, resultJSON, resultObject, space;
      try {
        namespaceDescriptor = this.getResolvedToken().namespaceDescriptor;
        resultObject = {};
        resultObject[namespaceDescriptor.jsonTag] = this.data();
        space = (space_ != null) && space_ || 0;
        resultJSON = JSON.stringify(resultObject, replacer_, space);
        if (!((resultJSON != null) && resultJSON)) {
          throw "Cannot serialize Javascript object to JSON!";
        }
        return resultJSON;
      } catch (exception) {
        throw "ONMjs.Namespace.toJSON failure: " + exception;
      }
    };

    Namespace.prototype.update = function() {
      var address, containingComponentNotified, count, descriptor, semanticBindings, updateAction, _results,
        _this = this;
      try {
        address = this.getResolvedAddress();
        semanticBindings = this.store.model.getSemanticBindings();
        updateAction = (semanticBindings != null) && semanticBindings && (semanticBindings.update != null) && semanticBindings.update || void 0;
        if ((updateAction != null) && updateAction) {
          updateAction(this.data());
          address.visitParentAddressesDescending(function(address__) {
            var dataReference;
            dataReference = _this.store.openNamespace(address__).data();
            return updateAction(dataReference);
          });
        }
        count = 0;
        containingComponentNotified = false;
        _results = [];
        while ((address != null) && address) {
          descriptor = address.implementation.getDescriptor();
          if (count === 0) {
            this.store.reifier.dispatchCallback(address, "onNamespaceUpdated", void 0);
          } else {
            this.store.reifier.dispatchCallback(address, "onSubnamespaceUpdated", void 0);
          }
          if (descriptor.namespaceType === "component" || descriptor.namespaceType === "root") {
            if (!containingComponentNotified) {
              this.store.reifier.dispatchCallback(address, "onComponentUpdated", void 0);
              containingComponentNotified = true;
            } else {
              this.store.reifier.dispatchCallback(address, "onSubcomponentUpdated", void 0);
            }
          }
          address = address.createParentAddress();
          _results.push(count++);
        }
        return _results;
      } catch (exception) {
        throw "ONMjs.Namespace.update failure: " + exception;
      }
    };

    Namespace.prototype.visitExtensionPointSubcomponents = function(callback_) {
      var address, key, object, resolvedToken, token, _ref;
      try {
        resolvedToken = this.getResolvedToken();
        if (!((resolvedToken != null) && resolvedToken)) {
          throw "Internal error: unable to resolve token.";
        }
        if (resolvedToken.namespaceDescriptor.namespaceType !== "extensionPoint") {
          throw "You may only visit the subcomponents of an extension point namespace.";
        }
        _ref = this.data();
        for (key in _ref) {
          object = _ref[key];
          address = this.getResolvedAddress().clone();
          token = new ONMjs.AddressToken(this.store.model, resolvedToken.idNamespace, key, resolvedToken.namespaceDescriptor.archetypePathId);
          address.implementation.pushToken(token);
          try {
            callback_(address);
          } catch (exception) {
            throw "Failure occurred inside your callback function implementation: " + exception;
          }
        }
        return true;
      } catch (exception) {
        throw "ONMjs.Namepsace.visitExtensionPointSubcomponents failure: " + exception;
      }
    };

    return Namespace;

  })();

  /*
  ------------------------------------------------------------------------------
  
  The MIT License (MIT)
  
  Copyright (c) 2013 Encapsule Project
    
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:
  
  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.
  
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
  
  **** Encapsule Project :: Build better software with circuit models ****
  
  OPEN SOURCES: http://github.com/Encapsule HOMEPAGE: http://Encapsule.org
  BLOG: http://blog.encapsule.org TWITTER: https://twitter.com/Encapsule
  
  ------------------------------------------------------------------------------
  
  
  
  ------------------------------------------------------------------------------
  */


  namespaceEncapsule = (typeof Encapsule !== "undefined" && Encapsule !== null) && Encapsule || (this.Encapsule = {});

  Encapsule.code = (Encapsule.code != null) && Encapsule.code || (this.Encapsule.code = {});

  Encapsule.code.lib = (Encapsule.code.lib != null) && Encapsule.code.lib || (this.Encapsule.code.lib = {});

  Encapsule.code.lib.onm = (Encapsule.code.lib.onm != null) && Encapsule.code.lib.onm || (this.Encapsule.code.lib.onm = {});

  Encapsule.code.lib.onm.implementation = (Encapsule.code.lib.onm.implementation != null) && Encapsule.code.lib.onm.implementation || (this.Encapsule.code.lib.onm.implementation = {});

  ONMjs = Encapsule.code.lib.onm;

  ONMjs.implementation.StoreReifier = (function() {

    function StoreReifier(objectStore_) {
      var _this = this;
      try {
        this.store = objectStore_;
        this.dispatchCallback = function(address_, callbackName_, observerId_) {
          var callbackFunction, callbackInterface, exceptionMessage, observerId, _ref, _results;
          try {
            if ((observerId_ != null) && observerId_) {
              callbackInterface = _this.store.observers[observerId_];
              if (!((callbackInterface != null) && callbackInterface)) {
                throw "Internal error: unable to resolve observer ID to obtain callback interface.";
              }
              callbackFunction = callbackInterface[callbackName_];
              if ((callbackFunction != null) && callbackFunction) {
                try {
                  return callbackFunction(_this.store, observerId_, address_);
                } catch (exception) {
                  throw "An error occurred in the '" + callbackName_ + "' method of your observer interface: " + exception;
                }
              }
            } else {
              _ref = _this.store.observers;
              _results = [];
              for (observerId in _ref) {
                callbackInterface = _ref[observerId];
                callbackFunction = callbackInterface[callbackName_];
                if ((callbackFunction != null) && callbackFunction) {
                  try {
                    _results.push(callbackFunction(_this.store, observerId, address_));
                  } catch (exception) {
                    throw "An error occurred in the '" + callbackName_ + "' method of your observer interface: " + exception;
                  }
                } else {
                  _results.push(void 0);
                }
              }
              return _results;
            }
          } catch (exception) {
            exceptionMessage = "ONMjs.implementation.StoreRefier.dispatchCallback failure while processing " + ("address='" + (address_.getHumanReadableString()) + "', callback='" + callbackName_ + "', observer='" + ((observerId_ != null) && observerId_ || "[broadcast all]") + "': " + exception);
            throw exceptionMessage;
          }
        };
        this.reifyStoreComponent = function(address_, observerId_) {
          var dispatchCallback;
          try {
            if (!((address_ != null) && address_)) {
              throw "Internal error: Missing address input parameter.";
            }
            if (!Encapsule.code.lib.js.dictionaryLength(_this.store.observers)) {
              return;
            }
            dispatchCallback = _this.dispatchCallback;
            dispatchCallback(address_, "onComponentCreated", observerId_);
            address_.visitSubaddressesAscending(function(addressSubnamespace_) {
              return dispatchCallback(addressSubnamespace_, "onNamespaceCreated", observerId_);
            });
            return true;
          } catch (exception) {
            throw "ONMjs.implementation.StoreReifier failure: " + exception;
          }
        };
        this.unreifyStoreComponent = function(address_, observerId_) {
          var dispatchCallback;
          try {
            if (!((address_ != null) && address_)) {
              throw "Internal error: Missing address input parameter.";
            }
            if (!Encapsule.code.lib.js.dictionaryLength(_this.store.observers)) {
              return;
            }
            dispatchCallback = _this.dispatchCallback;
            address_.visitSubaddressesDescending(function(addressSubnamespace_) {
              return dispatchCallback(addressSubnamespace_, "onNamespaceRemoved", observerId_);
            });
            dispatchCallback(address_, "onComponentRemoved", observerId_);
            return true;
          } catch (exception) {
            throw "ONMjs.implementation.StoreReifier failure: " + exception;
          }
        };
        this.reifyStoreExtensions = function(address_, observerId_, undoFlag_) {
          var dispatchCallback;
          try {
            if (!((address_ != null) && address_)) {
              throw "Internal error: Missing address input parameter.";
            }
            if (!Encapsule.code.lib.js.dictionaryLength(_this.store.observers)) {
              return;
            }
            dispatchCallback = _this.dispatchCallback;
            return address_.visitExtensionPointAddresses(function(addressExtensionPoint_) {
              var extensionPointNamespace;
              extensionPointNamespace = new ONMjs.Namespace(_this.store, addressExtensionPoint_);
              extensionPointNamespace.visitExtensionPointSubcomponents(function(addressSubcomponent_) {
                if (!undoFlag_) {
                  _this.reifyStoreComponent(addressSubcomponent_, observerId_);
                  _this.reifyStoreExtensions(addressSubcomponent_, observerId_, false);
                } else {
                  _this.reifyStoreExtensions(addressSubcomponent_, observerId_, true);
                  _this.unreifyStoreComponent(addressSubcomponent_, observerId_);
                }
                return true;
              });
              return true;
            });
          } catch (exception) {
            throw "ONMjs.implementation.StoreReifier failure: " + exception;
          }
        };
      } catch (exception) {
        throw "ONMjs.implementation.StoreReifier constructor failed: " + exception;
      }
    }

    return StoreReifier;

  })();

  /*
  ------------------------------------------------------------------------------
  
  The MIT License (MIT)
  
  Copyright (c) 2013 Encapsule Project
    
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:
  
  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.
  
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
  
  **** Encapsule Project :: Build better software with circuit models ****
  
  OPEN SOURCES: http://github.com/Encapsule HOMEPAGE: http://Encapsule.org
  BLOG: http://blog.encapsule.org TWITTER: https://twitter.com/Encapsule
  
  ------------------------------------------------------------------------------
  
  
  
  ------------------------------------------------------------------------------
  */


  namespaceEncapsule = (typeof Encapsule !== "undefined" && Encapsule !== null) && Encapsule || (this.Encapsule = {});

  Encapsule.code = (Encapsule.code != null) && Encapsule.code || (this.Encapsule.code = {});

  Encapsule.code.lib = (Encapsule.code.lib != null) && Encapsule.code.lib || (this.Encapsule.code.lib = {});

  Encapsule.code.lib.onm = (Encapsule.code.lib.onm != null) && Encapsule.code.lib.onm || (this.Encapsule.code.lib.onm = {});

  Encapsule.code.lib.onm.implementation = (Encapsule.code.lib.onm.implementation != null) && Encapsule.code.lib.onm.implementation || (this.Encapsule.code.lib.onm.implementation = {});

  ONMjs = Encapsule.code.lib.onm;

  ONMjs.Store = (function() {

    function Store(model_, initialStateJSON_) {
      var parsedObject, token, tokenBinder,
        _this = this;
      try {
        this.reifier = new ONMjs.implementation.StoreReifier(this);
        if (!((model_ != null) && model_)) {
          throw "Missing object model parameter!";
        }
        this.model = model_;
        this.jsonTag = model_.jsonTag;
        this.label = model_.label;
        this.description = model_.description;
        this.dataReference = void 0;
        this.objectStoreSource = void 0;
        this.observers = {};
        this.observersState = {};
        if ((initialStateJSON_ != null) && initialStateJSON_) {
          parsedObject = JSON.parse(initialStateJSON_);
          this.objectStore = parsedObject[this.jsonTag];
          if (!((this.objectStore != null) && this.objectStore)) {
            throw "Cannot deserialize specified JSON string!";
          }
          this.objectStoreSource = "json";
        } else {
          this.dataReference = {};
          this.objectStoreSource = "new";
          token = new ONMjs.AddressToken(model_, void 0, void 0, 0);
          tokenBinder = new ONMjs.implementation.AddressTokenBinder(this, this.dataReference, token, "new");
        }
        this.validateAddressModel = function(address_) {
          try {
            if (!((address_ != null) && address_)) {
              throw "Missing address input parameter.";
            }
            return _this.model.isEqual(address_.model);
          } catch (exception) {
            throw "ONMjs.Store.verifyAddress failure: " + exception;
          }
        };
        this.createComponent = function(address_) {
          var componentNamespace, descriptor;
          try {
            if (!((address_ != null) && address_)) {
              throw "Missing object model namespace selector input parameter.";
            }
            if (!_this.validateAddressModel(address_)) {
              throw "The specified address cannot be used to reference this store because it's not bound to the same model as this store.";
            }
            if (address_.isQualified()) {
              throw "The specified address is qualified and may only be used to specify existing objects in the store.";
            }
            descriptor = address_.implementation.getDescriptor();
            if (!descriptor.isComponent) {
              throw "The specified address does not specify the root of a component.";
            }
            if (descriptor.namespaceType === "root") {
              throw "The specified address refers to the root namespace of the store which is created automatically.";
            }
            componentNamespace = new ONMjs.Namespace(_this, address_, "new");
            return componentNamespace;
          } catch (exception) {
            throw "ONMjs.Store.createComponent failure: " + exception;
          }
        };
        this.removeComponent = function(address_) {
          var componentDictionary, componentKey, componentNamespace, descriptor, extensionPointAddress, extensionPointNamespace;
          try {
            if (!((address_ != null) && address_)) {
              throw "Missing address input parameter!";
            }
            if (!_this.validateAddressModel(address_)) {
              throw "The specified address cannot be used to reference this store because it's not bound to the same model as this store.";
            }
            if (!address_.isQualified()) {
              throw "You cannot use an unqualified address to remove a component.";
            }
            descriptor = address_.implementation.getDescriptor();
            if (!descriptor.isComponent) {
              throw "The specified address does not specify the root of a component.";
            }
            if (descriptor.namespace === "root") {
              throw "The specified address refers to the root namespace of the store which cannot be removed.";
            }
            _this.reifier.reifyStoreExtensions(address_, void 0, true);
            _this.reifier.unreifyStoreComponent(address_);
            componentNamespace = _this.openNamespace(address_);
            extensionPointAddress = address_.createParentAddress();
            extensionPointNamespace = _this.openNamespace(extensionPointAddress);
            componentDictionary = extensionPointNamespace.data();
            componentKey = address_.implementation.getLastToken().key;
            delete componentDictionary[componentKey];
            extensionPointNamespace.update();
            return componentNamespace;
          } catch (exception) {
            throw "ONMjs.Store.removeComponent failure: " + exception;
          }
        };
        this.openNamespace = function(address_) {
          var namespace;
          try {
            if (!(address_ && address_)) {
              throw "Missing address input parameter.";
            }
            if (!_this.validateAddressModel(address_)) {
              throw "The specified address cannot be used to reference this store because it's not bound to the same model as this store.";
            }
            namespace = new ONMjs.Namespace(_this, address_, "bypass");
            return namespace;
          } catch (exception) {
            throw "ONMjs.Store.openNamespace failure: " + exception;
          }
        };
        this.toJSON = function(replacer_, space_) {
          var resultJSON, rootNamespace;
          try {
            rootNamespace = _this.openNamespace(_this.model.createRootAddress());
            resultJSON = rootNamespace.toJSON(replacer_, space_);
            return resultJSON;
          } catch (exception) {
            throw "ONMjs.Store.toJSON fail on object store " + _this.jsonTag + " : " + exception;
          }
        };
        this.registerObserver = function(observerCallbackInterface_, observingEntityReference_) {
          var observerIdCode, rootAddress;
          try {
            if (!((observerCallbackInterface_ != null) && observerCallbackInterface_)) {
              throw "Missing callback interface namespace input parameter..";
            }
            observerCallbackInterface_.observingEntity = observingEntityReference_;
            observerIdCode = uuid.v4();
            _this.observers[observerIdCode] = observerCallbackInterface_;
            rootAddress = _this.model.createRootAddress();
            _this.reifier.dispatchCallback(void 0, "onObserverAttachBegin", observerIdCode);
            _this.reifier.reifyStoreComponent(rootAddress, observerIdCode);
            _this.reifier.reifyStoreExtensions(rootAddress, observerIdCode);
            _this.reifier.dispatchCallback(void 0, "onObserverAttachEnd", observerIdCode);
            return observerIdCode;
          } catch (exception) {
            throw "ONMjs.Store.registerObserver failure: " + exception;
          }
        };
        this.unregisterObserver = function(observerIdCode_) {
          var registeredObserver, rootAddress;
          try {
            if (!((observerIdCode_ != null) && observerIdCode_)) {
              throw "Missing observer ID code input parameter!";
            }
            registeredObserver = _this.observers[observerIdCode_];
            if (!((registeredObserver != null) && registeredObserver)) {
              throw "Unknown observer ID code provided. No registration to remove.";
            }
            _this.reifier.dispatchCallback(void 0, "onObserverDetachBegin", observerIdCode_);
            rootAddress = _this.model.createRootAddress();
            _this.reifier.reifyStoreExtensions(rootAddress, observerIdCode_, true);
            _this.reifier.unreifyStoreComponent(rootAddress, observerIdCode_);
            _this.reifier.dispatchCallback(void 0, "onObserverDetachEnd", observerIdCode_);
            _this.removeObserverState(observerIdCode_);
            return delete _this.observers[observerIdCode_];
          } catch (exception) {
            throw "ONMjs.Store.unregisterObserver failure: " + exception;
          }
        };
        this.openObserverState = function(observerId_) {
          var observerState;
          try {
            if (!((observerId_ != null) && observerId_)) {
              throw "Missing observer ID parameter!";
            }
            observerState = (_this.observersState[observerId_] != null) && _this.observersState[observerId_] || (_this.observersState[observerId_] = []);
            return observerState;
          } catch (exception) {
            throw "ONMjs.Store.openObserverStateObject failure: " + exception;
          }
        };
        this.removeObserverState = function(observerId_) {
          if (!((observerId_ != null) && observerId_)) {
            throw "Missing observer ID parameter!";
          }
          if ((typeof observerState !== "undefined" && observerState !== null) && observerState) {
            if ((_this.observerState[observerId_] != null) && _this.observerState[observerId_]) {
              delete _this.observerState[observerId_];
            }
          }
          return _this;
        };
        this.openObserverComponentState = function(observerId_, address_) {
          var componentAddress, componentNamespaceId;
          try {
            if (!((observerId_ != null) && observerId_)) {
              throw "Missing observer ID parameter.";
            }
            if (!((address_ != null) && address_)) {
              throw "Missing address input parameter.";
            }
            token = address_.implementation.getLastToken();
            componentNamespaceId = token.componentDescriptor.id;
            componentAddress = address_.createComponentAddress();
            return _this.openObserverNamespaceState(observerId_, componentAddress);
          } catch (exception) {
            throw "ONMjs.Store.openObserverComponentState failure: " + exception;
          }
        };
        this.openObserverNamespaceState = function(observerId_, address_) {
          var namespacePathId, namespacePathState, namespaceState, namespaceURN, observerState;
          try {
            if (!((observerId_ != null) && observerId_)) {
              throw "Missing observer ID parameter.";
            }
            if (!((address_ != null) && address_)) {
              throw "Missing address input parameter.";
            }
            observerState = _this.openObserverState(observerId_);
            token = address_.implementation.getLastToken();
            namespacePathId = token.namespaceDescriptor.id;
            namespacePathState = (observerState[namespacePathId] != null) && observerState[namespacePathId] || (observerState[namespacePathId] = {});
            namespaceURN = address_.getHashString();
            namespaceState = (namespacePathState[namespaceURN] != null) && namespacePathState[namespaceURN] || (namespacePathState[namespaceURN] = {});
            return namespaceState;
          } catch (exception) {
            throw "ONMjs.Store.openObserverNamespaceState failure: " + exception;
          }
        };
        this.removeObserverNamespaceState = function(observerId_, address_) {
          var namespaceHash, observerState, pathRecord;
          observerState = _this.modelViewObserversState[observerId_];
          if (!((observerState != null) && observerState)) {
            return _this;
          }
          pathRecord = observerState[namespaceSelector_.pathId];
          if (!((pathRecord != null) && pathRecord)) {
            return _this;
          }
          namespaceHash = namespaceSelector_.getHashString();
          delete pathRecord[namespaceHash];
          if (Encapsule.code.lib.js.dictionaryLength(pathRecord) === 0) {
            delete observerState[namespaceSelector_.pathId];
          }
          return _this;
        };
      } catch (exception) {
        throw "ONMjs.Store failure: " + exception;
      }
    }

    return Store;

  })();

  /*
  ------------------------------------------------------------------------------
  
  The MIT License (MIT)
  
  Copyright (c) 2013 Encapsule Project
    
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:
  
  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.
  
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
  
  **** Encapsule Project :: Build better software with circuit models ****
  
  OPEN SOURCES: http://github.com/Encapsule HOMEPAGE: http://Encapsule.org
  BLOG: http://blog.encapsule.org TWITTER: https://twitter.com/Encapsule
  
  ------------------------------------------------------------------------------
  
  
  ------------------------------------------------------------------------------
  */


  namespaceEncapsule = (typeof Encapsule !== "undefined" && Encapsule !== null) && Encapsule || (this.Encapsule = {});

  Encapsule.code = (Encapsule.code != null) && Encapsule.code || (this.Encapsule.code = {});

  Encapsule.code.lib = (Encapsule.code.lib != null) && Encapsule.code.lib || (this.Encapsule.code.lib = {});

  Encapsule.code.lib.onm = (Encapsule.code.lib.onm != null) && Encapsule.code.lib.onm || (this.Encapsule.code.lib.onm = {});

  ONMjs = Encapsule.code.lib.onm;

  ONMjs.CachedAddress = (function(_super) {

    __extends(CachedAddress, _super);

    function CachedAddress(referenceStore_, address_) {
      this.setAddress = __bind(this.setAddress, this);

      this.getAddress = __bind(this.getAddress, this);

      var selectorAddress, selectorModel,
        _this = this;
      try {
        if (!((referenceStore_ != null) && referenceStore_)) {
          throw "Missing object store input parameter. Unable to determine external selector type.";
        }
        this.referenceStore = referenceStore_;
        selectorModel = new ONMjs.Model({
          jsonTag: "cachedAddress",
          label: "" + referenceStore_.model.jsonTag + " Address Cache",
          description: "" + referenceStore_.model.label + " observable address cache."
        });
        CachedAddress.__super__.constructor.call(this, selectorModel);
        selectorAddress = selectorModel.createRootAddress();
        this.selectorNamespace = new ONMjs.Namespace(this, selectorAddress);
        this.selectorNamespaceData = this.selectorNamespace.data();
        this.selectorNamespaceData.selectedNamespace = void 0;
        this.setAddress(address_);
        this.objectStoreCallbacks = {
          onNamespaceUpdated: function(objectStore_, observerId_, address_) {
            var cachedAddress;
            try {
              cachedAddress = _this.getAddress();
              if (cachedAddress.isEqual(address_)) {
                return _this.setAddress(address_);
              }
            } catch (exception) {
              throw "ONMjs.CachedAddress.objectStoreCallbacks.onNamespaceUpdated failure: " + exception;
            }
          },
          onNamespaceRemoved: function(objectStore_, observerId_, address_) {
            var cachedAddress, parentAddress;
            try {
              cachedAddress = _this.getAddress();
              if (cachedAddress.isEqual(address_)) {
                parentAddress = cachedAddress.createParentAddress();
                _this.setAddress(parentAddress);
              }
            } catch (exception) {
              throw "ONMjs.CachedAddress.objectStoreCallbacks.onNamespaceRemoved failure: " + exception;
            }
          }
        };
      } catch (exception) {
        throw "ONMjs.CachedAddress failure: " + exception;
      }
    }

    CachedAddress.prototype.getAddress = function() {
      var namespace;
      try {
        namespace = this.selectorNamespaceData.selectedNamespace;
        if (!((namespace != null) && namespace)) {
          return void 0;
        }
        return namespace.getResolvedAddress();
      } catch (exception) {
        throw "ONMjs.CachedAddress.getSelector failure: " + exception;
      }
    };

    CachedAddress.prototype.setAddress = function(address_) {
      try {
        if (!(address_ && address_)) {
          this.selectorNamespaceData.selectedNamespace = void 0;
        } else {
          this.selectorNamespaceData.selectedNamespace = new ONMjs.Namespace(this.referenceStore, address_);
        }
        return this.selectorNamespace.update();
      } catch (exception) {
        throw "ONMjs.CachedAddress.setAddress failure: " + exception;
      }
    };

    return CachedAddress;

  })(ONMjs.Store);

  Encapsule.code.lib.onm.about = {};

  Encapsule.code.lib.onm.about.version = "0.0.7";

  Encapsule.code.lib.onm.about.build = "Tue Oct 15 05:06:57 UTC 2013";

  Encapsule.code.lib.onm.about.epoch = "1381813617";

  Encapsule.code.lib.onm.about.uuid = "f97b0724-aa13-4f3e-b130-0bad36071c98";

}).call(this);
