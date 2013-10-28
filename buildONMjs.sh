#! /bin/sh
#
# release.update.build
# feature.release.build

# version, update, build
onm_version="0.0.29"
echo =================================================================

lib_prefix="ONMjs-lib"

lib_debug=$lib_prefix-debug
lib_min=$lib_prefix-min

lib_core_prefix=$lib_prefix-core
lib_observer_prefix=$lib_prefix-observer

lib_core_debug=$lib_core_prefix-debug
lib_core_min=$lib_core_prefix-min

lib_observer_debug=$lib_observer_prefix-debug
lib_observer_min=$lib_observer_prefix-min

echo onm_version=$onm_version

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
lib_latest=$lib/latest
lib_release=$lib/release


sources=$repoDir/sources
sources_cs=$sources/cs
sources_cs_core=$sources_cs/core
sources_cs_observer=$sources_cs/observer
sources_cs_models=$sources_cs/models
sources_js=$sources/js
echo sources=$sources
echo sources_cs=$sources_cs
echo sources_cs_core=$sources_cs_core
echo sources_cs_observer=$sources_cs_observer
echo sources_cs_models=$sources_cs_models
echo sources_js=$sources_js

stage=$repoDir/stage
stage_cs=$stage/cs
stage_cs_core=$stage_cs/core
stage_cs_observer=$stage_cs/observer
stage_cs_models=$stage_cs/models
stage_js=$stage/js
stage_js_core=$stage_js/core
stage_js_observer=$stage_js/observer
stage_js_models=$stage_js/models
echo stage=$stage
echo stage_cs=$stage_cs
echo stage_cs_core=$stage_cs_core
echo stage_cs_observer=$stage_cs_observer
echo stage_cs_models=$stage_cs_models
echo stage_js=$stage_js
echo stage_js_core=$stage_js_core
echo stage_js_observer=$stage_js_observer
echo stage_js_models=$stage_js_models



app_build_date=`date -u`
app_build_uuid=`uuidgen`
app_build_epoch=`date +%s`
echo app_build_date=$app_build_date
echo app_build_epoch=$app_build_epoch
echo app_build_uuid=$app_build_uuid

echo =================================================================

if [ ! -d $lib ]
then
    echo Creating new lib directory...
    mkdir $lib
    mkdir $lib_latest
    mkdir $lib_release
fi

if [ -d $lib_latest ]
then
    echo Removing old lib directory...
    rm -rf $lib_latest
fi

if [ ! -d $lib_latest ]
then
    mkdir $lib_latest
fi

if [ -d $stage ]
then
    echo Removing old staging directory...
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
    mkdir $stage_cs_models

    echo "Staging files..."
    cp $sources_cs_core/*.coffee $stage_cs_core/
    cp $sources_cs_observer/*.coffee $stage_cs_observer/
    cp $sources_cs_models/*.coffee $stage_cs_models/

    echo ... creating ONMjs-core-version.coffee
    onmvfile=$stage_cs_core/ONMjs-core-version.coffee
    touch $onmvfile
    echo '# generated by buildONMjs.sh' >> $onmvfile
    echo 'Encapsule.code.lib.onm.about = {}' >> $onmvfile
    echo 'Encapsule.code.lib.onm.about.version = "'$onm_version'"' >> $onmvfile
    echo 'Encapsule.code.lib.onm.about.build = "'$app_build_date'"' >> $onmvfile
    echo 'Encapsule.code.lib.onm.about.epoch = "'$app_build_epoch'"' >> $onmvfile
    echo 'Encapsule.code.lib.onm.about.uuid = "'$app_build_uuid'"' >> $onmvfile

    onmcfile=$stage_cs/$lib_core_debug.coffee
    onmofile=$stage_cs/$lib_observer_debug.coffee
    onmfile=$stage_cs/$lib_debug.coffee

    echo ... creating $onmcfile
    touch $onmcfile
    cat $sources_cs_core/encapsule-lib-javascript.coffee >> $onmcfile
    cat $sources_cs_core/encapsule-lib-backchannel.coffee >> $onmcfile
    cat $sources_cs_core/ONMjs-core-model.coffee >> $onmcfile
    cat $sources_cs_core/ONMjs-core-address.coffee >> $onmcfile
    cat $sources_cs_core/ONMjs-core-address-binder.coffee >> $onmcfile
    cat $sources_cs_core/ONMjs-core-address-token.coffee >> $onmcfile
    cat $sources_cs_core/ONMjs-core-namespace.coffee >> $onmcfile
    cat $sources_cs_core/ONMjs-core-store-reifier.coffee >> $onmcfile
    cat $sources_cs_core/ONMjs-core-store.coffee >> $onmcfile
    cat $sources_cs_core/ONMjs-core-address-store.coffee >> $onmcfile
    cat $stage_cs_core/ONMjs-core-version.coffee >> $onmcfile
    cat $sources_cs_models/ONMjs-data-model-self.coffee >> $onmcfile

    echo ... creating $onmofile
    touch $onmofile
    cat $sources_cs_observer/encapsule-lib-knockout-bindings.coffee >> $onmofile
    cat $sources_cs_observer/encapsule-lib-knockout-templates.coffee >> $onmofile
    cat $sources_cs_observer/ONMjs-observer-generic-test.coffee >> $onmofile
    cat $sources_cs_observer/ONMjs-observer-backchannel.coffee >> $onmofile
    cat $sources_cs_observer/ONMjs-observer-navigator-tree.coffee >> $onmofile
    cat $sources_cs_observer/ONMjs-observer-navigator-tree-item.coffee >> $onmofile
    cat $sources_cs_observer/ONMjs-observer-selected-json.coffee >> $onmofile
    cat $sources_cs_observer/ONMjs-observer-selected-path.coffee >> $onmofile
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
if [ ! -d $lib ]
then
    mkdir $lib
fi
if [ -d $lib_latest ]
then
    rmdir -rf $lib_latest
fi
if [ ! -d $lib_latest ]
then
    mkdir $lib_latest
fi
if [ -d $lib_release ]
then
    rmdir $lib_release
fi
if [ ! -d $lib_release ]
then
    mkdir $lib_release
fi
echo =================================================================
echo Compiling ONMjs library CoffeeScript sources...
echo ... main library sources
coffee -o $stage_js/ -c $stage_cs/*.coffee
echo ... individual core
coffee -o $stage_js_core/ -c $stage_cs_core/*.coffee
echo ... individual observer
coffee -o $stage_js_observer/ -c $stage_cs_observer/*.coffee
echo ... data models
coffee -o $stage_js_models/ -c $stage_cs_models/*.coffee

echo =================================================================
echo Finalizing ONMjs library debug Javascript files...
cp $stage_js/$lib_core_debug.js $stage_js/$lib_core_debug-raw.js
cat $stage_js/uuid.js $stage_js/$lib_core_debug-raw.js > $stage_js/$lib_core_debug.js
rm $stage_js/$lib_core_debug-raw.js
rm $stage_js/uuid.js
cat $stage_js/$lib_core_debug.js $stage_js/$lib_observer_debug.js > $stage_js/$lib_debug.js

echo =================================================================
echo Generating ONMjs library release Javascript files...
echo ... $stage_js/$lib_core_min.js
uglifyjs -mangle -v $stage_js/$lib_core_debug.js > $stage_js/$lib_core_min.js
echo ... $stage_js/$lib_observer_min.js
uglifyjs -mangle -v $stage_js/$lib_observer_debug.js > $stage_js/$lib_observer_min.js
echo ... $stage_js/$lib_min.js
uglifyjs -mangle -v $stage_js/$lib_debug.js > $stage_js/$lib_min.js

echo =================================================================
echo Generating ONMjs library versioned Javascript files...
for x in $stage_js/*.js
do
    versionedFilename=$stage_js/`basename -s .js $x`-$onm_version.js
    cp $x $versionedFilename
    echo ... $versionedFilename
done

cp $stage_js/ONMjs-lib*.js $lib_latest



echo =================================================================
echo COMPLETE. STAGED FILES:
ls -l $stage_js/$lib_prefix*


if [ "$1" = "release" ]
then
echo "RELEASING..."

if [ -d $lib_release ]
then
    rm -rf $lib_release
    mkdir $lib_release
fi

cp $stage_js/ONMjs-lib-core-debug*.js $lib_release/
cp $stage_js/ONMjs-lib-core-min*.js $lib_release/


cp $stage_js/ONMjs-lib-observer-debug*.js $lib_release/
cp $stage_js/ONMjs-lib-observer-min*.js $lib_release

cp $stage_js/ONMjs-lib-debug*.js $lib_release/
cp $stage_js/ONMjs-lib-min*.js $lib_release/

fi

echo =================================================================
echo =================================================================
echo =================================================================
ls -lR lib/
echo =================================================================
echo =================================================================
echo =================================================================







   
