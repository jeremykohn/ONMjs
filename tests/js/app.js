
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
            jsonTag: "testDataRoot"
        };

        Console.message("Creating an ONMjs data model.");
        var dataModel = new ONMjs.Model(dataModelDeclaration);

        Console.message("Creating an ONMjs data store.");
        var dataStore = new ONMjs.Store(dataModel);

        Console.message("Creating an ONMjs generic observer.");
        var observerCanary = new ONMjs.test.observers.Canary();

        Console.message("Attaching observer to data store...");
        var observerId = dataStore.registerObserver(observerCanary.callbackInterface, observerCanary);

        Console.message("Beginning tests.");
        Console.message("Tests completed successfully.");

        Console.message("Detaching observer from data store...");
        dataStore.unregisterObserver(observerId);

        Console.message("Test app exit.");

    } catch (exception) {
        Console.messageError("ONMjs Test Page failure: " + exception);
    }

});
