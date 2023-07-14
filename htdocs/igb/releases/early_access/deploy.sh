#!/usr/bin/env bash
# run this to deploy IGB early access (master branch)
# assumes bitbucket custom pipeline build-master-branch-installers was run on master branch
branch="main-JDK8"
installers="$branch.dmg $branch.sh $branch.exe"
base="https://bitbucket.org/lorainelab/integrated-genome-browser/downloads"
for installer in $installers;
do
    url="$base/$installer"
    cmd="wget -O $installer $url"
    $cmd
    mv $installer IGB-$installer
done
