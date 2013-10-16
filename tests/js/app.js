
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
                        ____description: "An address book contact data object."
                    }
                }
            ],
            semanticBindings: {
                getUniqueKey: function(data_) {
                    data_.key = uuid.v4();
                    return data_.key;
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

        Console.message("Tests completed successfully.");

        Console.message("Detaching observers...");
        addressStore.unregisterObserver(observerIdAddress);
        dataStore.unregisterObserver(observerIdData);

        Console.message("Tests passed successfully. App exiting normally.");

    } catch (exception) {
        Console.messageError("ONMjs Test Page failure: " + exception);
    }

});
