[BioViz.org](https://bioviz.org) Web content - version-controlled for easy deployment and testing. 

### About ###

BioViz.org is the chief distribution site for Integrated Genome Browser.

This repository contains Web content for BioViz.org, along with javascript bridge code that lets users flow data from sites like Galaxy into IGB. 

For IGB source code, see [https://bitbucket.org/lorainelab/integrated-genome-browser](https://bitbucket.org/lorainelab/integrated-genome-browser)

### Developing this site ###

The site is designed to be deployed as-is into Web-accessible directories for development, testing, and (ultimately) deployment
via git pull commands on the main bioviz.org site. 

To update or add content:

* fork this repository on bitbucket
* clone your fork to your preferred development environment
* make a branch on your clone and edit 
* push the branch to your fork
* issue a pull request from your branch to master on the team (main) repo

For testing and review, deploy your branch on a staging site. Include a link to the staging site in your pull request.

### Setting up a staging site ###

Dr. Loraine has written ansible playbooks to automate bioviz site setup.

See: https://bitbucket.org/lorainelab/bioviz-playbooks
