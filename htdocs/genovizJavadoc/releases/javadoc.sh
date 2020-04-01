#!/usr/bin/env bash
if [ "$1" == "" ]; then
    echo "Kindly specify the Genoviz SDK version".
else
    javadoc_url="https://bitbucket.org/lorainelab/genoviz-sdk/downloads/genoviz-$1-javadoc.jar"
    cmd="wget $javadoc_url"
    $cmd
    tar xvzf "./genoviz-$1-javadoc.jar"
    rm "./genoviz-$1-javadoc.jar"
fi
