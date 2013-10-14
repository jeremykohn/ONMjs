#! /bin/sh
#

onm_version="0.0.6"

lib_prefix="ONMjs-lib"
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

build=$repoDir/build
build_cs=$build/cs
build_cs_core=$build_cs/core
build_cs_observer=$build_cs/observer
build_js=$build/js

if [ -d $build ]
then
    rm -rf $build
    mkdir $build
fi

if [ ! -d $build_cs ]
then
    mkdir $build_cs
    mkdir $build_cs_core
    mkdir $build_cs_observer

    cp $sources_cs_core/*.coffee $build_cs_core/
    cp $sources_cs_observer/*.coffee $build_cs_observer/

    echo 'Encapsule.code.lib.onm.version = "'$onm_version'"\n\n' > $build_cs_core/ONMjs-core-version.coffee

    onmcfile=$build_cs_core/$lib_core_debug.coffee
    onmofile=$build_cs_observer/$lib_observer_debug.coffee

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
    cat $build_cs_core/ONMjs-core-version.coffee >> $onmcfile

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

if [ ! -d $build_js ]
then
    mkdir $build_js

    cp $sources_js/*.js $build_js/
fi








   
