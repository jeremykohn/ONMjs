
$(function() {

    try {

        var titleEl = $("#idTitle");
        titleEl.html("ONMjs Test Page");

        var ONMjs = Encapsule.code.lib.onm;

        Console.message("ONMjs.about.version=" + ONMjs.about.version);
        Console.message("ONMjs.about.uuid=" + ONMjs.about.uuid);
        Console.message("ONMjs.about.build=" + ONMjs.about.build);
        Console.message("ONMjs.about.epoch=" + ONMjs.about.epoch);

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
        Console.message("Beginning tests.");


        Console.message("Creating an ONMjs data model.");
        var dataModel = new ONMjs.Model(dataModelDeclaration);

        Console.message("Creating an ONMjs data store.");
        var dataStore = new ONMjs.Store(dataModel);

        var address = dataModel.createPathAddress("addressBook.contacts");

        Console.message("Creating an ONMjs address store.");
        var addressStore = new ONMjs.AddressStore(dataStore, address);

        Console.message("Creating generic observer.");
        var genericObserver = new ONMjs.observers.GenericTest();

        Console.message("Attaching observers...");
        var observerIdData = dataStore.registerObserver(genericObserver.callbackInterface, "Data Store Observer");
        var observerIdAddress = addressStore.registerObserver(genericObserver.callbackInterface, "Address Store Observer");

        var newContactAddress  = dataModel.createPathAddress("addressBook.contacts.contact");

        Console.message("Creating new contact in address book.");
        var newContactNamespace = dataStore.createComponent(newContactAddress);

        Console.message("Creating new contact in address book.");
        var newContactNamespace = dataStore.createComponent(newContactAddress);

        addressStore.setAddress(newContactNamespace.getResolvedAddress());

        Console.message("Serializing address book store to JSON...");
        var jsonString = dataStore.toJSON();
        Console.message(jsonString);

        Console.message("Creating a new store from the serialized JSON...");
        var testStore = new ONMjs.Store(dataModel, jsonString);

        Console.message("Serializing the new store to JSON...");
        var jsonString2 = testStore.toJSON();

        Console.message("Comparing the two JSON strings: they should be the same!");
        if (jsonString != jsonString2) {
            throw "Deserialization test fail.";
        }

        Console.message("Tests completed successfully.");

        Console.message("Detaching observers...");
        addressStore.unregisterObserver(observerIdAddress);
        dataStore.unregisterObserver(observerIdData);

        var logHandler = function (html_) {
            $("#idLog").append(html_);
        };

        var errorHandler = function (error_) {
            logHandler(error_);
            alert(error_);
        };

        var observerContext = new ONMjs.observers.ObserverContext(logHandler, errorHandler)

        observerContext.log("This is a test log message");
        observerContext.error("This is an intentional error.");


        Console.message("Tests passed successfully. App exiting normally.");

    } catch (exception) {
        Console.messageError("ONMjs Test Page failure: " + exception);
    }

});
