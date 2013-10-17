
$(function() {

    try {

        var titleEl = $("#idTitle");
        titleEl.html("ONMjs Test Page");

        var ONMjs = Encapsule.code.lib.onm;

        var log = function (html_) {
            $("#idLog").append("&gt; " + html_ + "<br>");
        };

        var error = function (error_) {
            $("BODY").css( { backgroundColor: "#FFEEDD" } );
            $("#idLog").css( { backgroundColor: "#FFDDCC" } );
            log(error_);
            alert(error_);
        };

        var backchannel = new Encapsule.code.lib.base.BackChannel(log, error)

        log("ONMjs.about.version=" + ONMjs.about.version);
        log("ONMjs.about.uuid=" + ONMjs.about.uuid);
        log("ONMjs.about.build=" + ONMjs.about.build);
        log("ONMjs.about.epoch=" + ONMjs.about.epoch);

        var dataModelDeclaration = {
            namespaceType: "root",
            jsonTag: "addressBook",
            ____label: "Address Book",
            ____description: "Address book data object.",
            namespaceProperties: {
                userImmutable: {
                    key: { fnCreate: function() { return uuid.v4() } },
                    revision: { fnCreate: function() { return 0 } }
                },
                userMutable: {
                    label: { fnCreate: function() { return "default address book label" } },
                    description: { fnCreate: function() { return "default address book description" } }
                }
            },
            subNamespaces: [
                {
                    namespaceType: "extensionPoint",
                    jsonTag: "contacts",
                    ____label: "Contacts",
                    ____description: "A collection of address book contacts.",
                    componentArchetype: {
                        namespaceType: "component",
                        jsonTag: "contact",
                        ____label: "Contact",
                        ____description: "An address book contact data object.",
                        namespaceProperties: {
                            userImmutable: {
                                key: { fnCreate: function() { return uuid.v4() } },
                                revision: { fnCreate: function() { return 0 } }
                            },
                            userMutable: {
                                nameFirst: { fnCreate: function() { return "first" } },
                                nameLast: { fnCreate: function() { return "last" } }
                            }
                        }
                    }
                }
            ],
            semanticBindings: {
                getUniqueKey: function(data_) {
                    return data_.key;
                },
                update: function(data_) {
                    if (data_.revision != null) {
                        data_.revision++;
                    }
                    return true;
                }
            }
         
        };
        log("Beginning tests.");


        log("Creating an ONMjs data model.");
        var dataModel = new ONMjs.Model(dataModelDeclaration);

        log("Creating an ONMjs data store.");
        var dataStore = new ONMjs.Store(dataModel);

        var address = dataModel.createPathAddress("addressBook.contacts");

        log("Creating an ONMjs address store.");
        var addressStore = new ONMjs.AddressStore(dataStore, address);

        log("Registering the address store as an observer of the data store.");
        var addressStoreObserverId = dataStore.registerObserver(addressStore.objectStoreCallbacks, addressStore);

        log("Creating generic observer.");
        var genericObserver = new ONMjs.observers.GenericTest(backchannel);

        log("Attaching observers...");
        var observerIdData = dataStore.registerObserver(genericObserver.callbackInterface, "Data Store Observer");
        var observerIdAddress = addressStore.registerObserver(genericObserver.callbackInterface, "Address Store Observer");

        var newContactAddress  = dataModel.createPathAddress("addressBook.contacts.contact");

        log("Creating new contact in address book.");
        var newContactNamespace = dataStore.createComponent(newContactAddress);

        log("Creating new contact in address book.");
        var newContactNamespace = dataStore.createComponent(newContactAddress);

        addressStore.setAddress(newContactNamespace.getResolvedAddress());

        log("Serializing address book store to JSON...");
        var jsonString = dataStore.toJSON();
        log(jsonString);

        log("Creating a new store from the serialized JSON...");
        var testStore = new ONMjs.Store(dataModel, jsonString);

        log("Serializing the new store to JSON...");
        var jsonString2 = testStore.toJSON();

        log("Comparing the two JSON strings: they should be the same!");
        if (jsonString != jsonString2) {
            throw "Deserialization test fail.";
        }


        log("Creating an ONMjs.observers.NavigatorModelView instance.");
        var observerNavigator = new ONMjs.observers.NavigatorModelView(backchannel);
        observerNavigator.attachToStore(dataStore);
        observerNavigator.attachToCachedAddress(addressStore);

        log("Creating an ONMjs.observers.SelectedPathModelView instance.");
        var observerSelectedPath = new ONMjs.observers.SelectedPathModelView(backchannel);
        observerSelectedPath.attachToCachedAddress(addressStore);

        log("Creating an ONMjs.observers.SelectedNamespaceModelView instance.");
        var observerSelectedNamespace = new ONMjs.observers.SelectedNamespaceModelView(backchannel);
        observerSelectedNamespace.attachToCachedAddress(addressStore);

        log("Creating an ONMjs.observers.SelectedJsonModelView instance.");
        var observerSelectedJSON = new ONMjs.observers.SelectedJsonModelView(backchannel);
        observerSelectedJSON.attachToCachedAddress(addressStore);


        log("Tests completed successfully.");

        log("Detaching observers...");
        addressStore.unregisterObserver(observerIdAddress);
        dataStore.unregisterObserver(observerIdData);

        log("TESTS PASSED.");

    } catch (exception) {
        error("ONMjs Test Page failure: " + exception);
        log("TESTS FAILED.");
    }

});
