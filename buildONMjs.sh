#! /bin/sh
#

onm_version="0.0.6"

lib_prefix="ONMjs-lib"

lib_debug=$lib_prefix-debug
lib_min=$lib_prefix-min

lib_core_prefix=$lib_prefix-core
lib_observer_prefix=$lib_prefix-observer

lib_core_debug=$lib_core_prefix-debug
lib_core_min=$lib_core_prefix-min

lib_observer_debug=$lib_observer_prefix-debug
lib_observer_min=$lib_observer_prefix-min

echo lib_prefix=$lib_prefix
echo lib_core_prefix=$lib_core_prefix
echo lib_core_debug=$lib_core_debug
echo lib_core_min=$lib_core_min
echo lib_observer_prefix=$lib_observer_prefix
echo lib_observer_debug=$lib_observer_debug
echo lib_observer_min=$lib_observer_min

if [ ! -d sources ]
then
    echo "Please execute this script from the root directory of the ONMjs git repository."
    exit 1
fi

repoDir=`pwd`

lib=$repoDir/lib

sources=$repoDir/sources
sources_cs=$sources/cs
sources_cs_core=$sources_cs/core
sources_cs_observer=$sources_cs/observer
sources_js=$sources/js

echo $sources
echo $sources_cs
echo $sources_cs_core
echo $sources_cs_observer
echo $sources_js

stage=$repoDir/stage
stage_cs=$stage/cs
stage_cs_core=$stage_cs/core
stage_cs_observer=$stage_cs/observer
stage_js=$stage/js
stage_js_core=$stage_js/core
stage_js_observer=$stage_js/observer

echo stage=$stage
echo stage_cs=$stage_cs
echo stage_cs_core=$stage_cs_core
echo stage_cs_observer_=$stage_cs_observer
echo stage_js=$stage_js
echo stage_js_core=$stage_js_core
echo stage_js_observer=$stage_js_observer

if [ -d $stage ]
then
    echo Attempting to remove old staging directory...
    rm -rf $stage
fi

if [ ! -d $stage ]
then
    echo Creating new staging directory...
    mkdir $stage
fi

if [ ! -d $stage_cs ]
then
    mkdir $stage_cs
    mkdir $stage_cs_core
    mkdir $stage_cs_observer

    cp $sources_cs_core/*.coffee $stage_cs_core/
    cp $sources_cs_observer/*.coffee $stage_cs_observer/

    echo 'Encapsule.code.lib.onm.version = "'$onm_version'"\n\n' > $stage_cs_core/ONMjs-core-version.coffee

    onmcfile=$stage_cs/$lib_core_debug.coffee
    onmofile=$stage_cs/$lib_observer_debug.coffee
    onmfile=$stage_cs/$lib_debug.coffee

    touch $onmcfile
    cat $sources_cs_core/encapsule-lib-javascript.coffee >> $onmcfile
    cat $sources_cs_core/ONMjs-core-model.coffee >> $onmcfile
    cat $sources_cs_core/ONMjs-core-address.coffee >> $onmcfile
    cat $sources_cs_core/ONMjs-core-address-binder.coffee >> $onmcfile
    cat $sources_cs_core/ONMjs-core-address-token.coffee >> $onmcfile
    cat $sources_cs_core/ONMjs-core-namespace.coffee >> $onmcfile
    cat $sources_cs_core/ONMjs-core-store-reifier.coffee >> $onmcfile
    cat $sources_cs_core/ONMjs-core-store.coffee >> $onmcfile
    cat $sources_cs_core/ONMjs-core-cached-address.coffee >> $onmcfile
    cat $stage_cs_core/ONMjs-core-version.coffee >> $onmcfile

    touch $onmofile
    cat $sources_cs_observer/encapsule-lib-console.coffee >> $onmofile
    cat $sources_cs_observer/encapsule-lib-knockout-bindings.coffee >> $onmofile
    cat $sources_cs_observer/encapsule-lib-knockout-templates.coffee >> $onmofile
    cat $sources_cs_observer/ONMjs-observer-navigator-tree.coffee >> $onmofile
    cat $sources_cs_observer/ONMjs-observer-navigator-tree-item.coffee >> $onmofile
    cat $sources_cs_observer/ONMjs-observer-selected-json.coffee >> $onmofile
    cat $sources_cs_observer/ONMjs-observer-selected-path.coffee >> $onmofile
    cat $sources_cs_observer/ONMjs-observer-canary-test.coffee >> $onmofile
    cat $sources_cs_observer/ONMjs-observer-selected-namespace.coffee >> $onmofile
    cat $sources_cs_observer/ONMjs-observer-selected-namespace-actions.coffee >> $onmofile
    cat $sources_cs_observer/ONMjs-observer-selected-namespace-children.coffee >> $onmofile
    cat $sources_cs_observer/ONMjs-observer-selected-namespace-collection.coffee >> $onmofile
    cat $sources_cs_observer/ONMjs-observer-selected-namespace-component.coffee >> $onmofile
    cat $sources_cs_observer/ONMjs-observer-selected-namespace-helpers.coffee >> $onmofile
    cat $sources_cs_observer/ONMjs-observer-selected-namespace-properties.coffee >> $onmofile
    cat $sources_cs_observer/ONMjs-observer-selected-namespace-title.coffee >> $onmofile

fi

if [ ! -d $stage_js ]
then
    mkdir $stage_js

    cp $sources_js/*.js $stage_js/
fi

coffee -o $stage_js/ -c $stage_cs/*.coffee
coffee -o $stage_js_core/ -c $stage_cs_core/*.coffee
coffee -o $stage_js_observer/ -c $stage_cs_observer/*.coffee

cp $stage_js/$lib_core_debug.js $stage_js/$lib_core_debug-raw.js
cat $stage_js/uuid.js $stage_js/$lib_core_debug-raw.js > $stage_js/$lib_core_debug.js
rm $stage_js/$lib_core_debug-raw.js
rm $stage_js/uuid.js


cat $stage_js/$lib_core_debug.js $stage_js/$lib_observer_debug.js > $stage_js/$lib_debug.js

uglifyjs -mangle -v $stage_js/$lib_core_debug.js > $stage_js/$lib_core_min.js
uglifyjs -mangle -v $stage_js/$lib_observer_debug.js > $stage_js/$lib_observer_min.js
uglifyjs -mangle -v $stage_js/$lib_debug.js > $stage_js/$lib_min.js

for x in $stage_js/*.js
do
    cp $x $stage_js/`basename -s .js $x`-$onm_version.js
done













   
