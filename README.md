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
* clone your fork to a staging site (configured as below)
* make a branch on your staging site and edit 
* check edits by visiting your staging site in a Web browser 
* push the branch to your fork
* issue a pull request from your branch to master on the team (main) repo

**Note**: Include staging site URL in your pull request to make testing and reviewing easier.

### Setting up a staging site ###

The directions below assume you are using CentOS, Apache Web server and AWS for hosting. 

* Launch "free tier" micro EC2 image. 

This documentation assumes you're using CentOS Linux.

* Install software.

Install system updates, the Apache Web server, git, boto3 (AWS SDK), and SSL support. 

```
sudo yum update -y 
sudo yum install -y git emacs httpd mod_ssl
sudo pip install boto3
```

* Attach an IAM role with "AmazonDynamoDBReadOnlyAccess" policy to your EC2 instance

The CGI script geneIdLookup.py provides a Web service used by bar.js. It queries a dynamoDb table. 
If you are not working on this aspect of the site, you can ignore this step.

* Configure git. Make an ssh key and add it to your bitbucket user account settings. Tell git to use your Bitbucket user name.

See [documentation](https://confluence.atlassian.com/bitbucket/set-up-an-ssh-key-728138079.html#SetupanSSHkey-ssh2).

```
ssh-keygen # makes ~/.ssh/id_rsa.pub, copy this to your bitbucket account
git config --global user.name "bbuser" # your bitbucket user id
git config --global user.email "user@example.com" # your email address
sudo git config --global user.name "bbuser" # do it for root user too
sudo git config --global user.email "user@example.com" 
```

* Clone this repository into your home directory (~ec2-user) and copy it to the Web server's default web directory. 

On CentOS this is `/var/www`.

```
git clone git@bitbucket.org:bbuser/bioviz.git # clone your fork
sudo mv bioviz /var/www/. # move cloned repo to Web directories
```

* Configure Apache (httpd) to serve bioviz content from the cloned bioviz/htdocs directory by editing `httpd.conf`

The default document root is `/var/www/html`. Change this to `/var/www/bioviz/htdocs`. 

```
cd /etc/httpd/conf
sudo sed -i 's/\(var\/www\)\/html/\1\/bioviz\/htdocs/g' httpd.conf
```

The default script alias is `/var/www/cgi-bin`. Change this to `/var/www/bioviz/cgi-bin`.

```
cd /etc/httpd/conf
sudo sed -i 's/\(var\/www\)\/cgi-bin/\1\/bioviz\/cgi-bin/g' httpd.conf
```

* Ask Dr. Loraine to assign your site a bioviz.org subdomain, e.g., yourname.bioviz.org. Add the domain name to `/etc/httpd/conf/httpd.conf`.

The following example assumes the server's name is test.bioviz.org. 

```
cd /etc/httpd/conf
sudo sed -i 's/#ServerName www.example.com:80/ServerName test.bioviz.org:80/g' httpd.conf
```

## Support https URLs (SSL) ##

Install three files:

1) signed certificate (.crt) file issued for you from a trusted signing authority like Digicert
2) your server's private key, created when you made the certificate signing request for the signing authority
3) signed certificate (.crt) file from the signing authority

See also: [Digicert documentation](https://www.digicert.com/csr-ssl-installation/apache-openssl.htm) on how to configure SSL.

* Transfer the files to the server. 

Put the private key file (.key) in `/etc/pki/tls/private` and the two certificate files (.crt) in `/etc/pki/tls.private`. 

For example, assume the private key file is `star_bioviz_org.key`, the certificates files are `star_bioviz_org.crt` and `DigiCertCA.crt`,
and both are in your user home directory.

```
sudo mv ~/star_bioviz_org.key /etc/pki/tls/private/localhost.key
sudo mv ~/DigiCertCA.crt /etc/pki/tls/certs/server-chain.crt
sudo mv ~/star_bioviz_org.crt /etc/pki/tls/certs/localhost.crt
```

* Use `configtest` to check your server configurations.

```
sudo service httpd configtest
```


* Start the server and test it.

```
sudo service httpd start
```

* Test by visting the site in your Web browser. 

If you don't see the BioViz content, look at the server logs to diagnose the problem.

```
sudo cat /var/log/httpd/error_log
sudo cat /var/log/httpd/access_log
```

* Ensure Web server starts when you reboot the image.

```
sudo chkconfig httpd on
```

* Configure upstream repository (for synchronizing with the team repository)

Add the main (team) BioViz repository to your clone as a new remote called upstream. 

```
cd /var/www/bioviz
git remote add upstream git@bitbucket.org:lorainelab/bioviz.git
```

* Other conveniences

Add git aliases to make viewing your git commit history more convenient:

```
git config --global alias.ll 'log --decorate --numstat'
git config --global alias.ls 'log --decorate --oneline'
```

With these, you can type `git ll` or `git ls` to view and understand the commit history for whichever git clone you are currently in.

Add a git alias to view your current git aliases:

```
git config --global alias.alias 'config --get-regexp ^alias\.'
```

It's nice to have an shell (not git) alias that lets you change quickly into your cloned repository. Add this line to ~/.bash_profile:

```
alias go="cd /var/www/bioviz"
```

If you like emacs, make it your default editor by adding this line to ~/.bash_profile:

```
export EDITOR=emacs
```

## Other configurations ##

Older versions of IGB link to now-obsolete URLs on the BioViz.org Web site. To handle these gracefully,
add Redirect rules to httpd.conf in the appropropriate section of the file.

```
Redirect /igb/news.html https://bioviz.org/news.html
Redirect /igb/help.html https://bioviz.org/help.html
```

The `news.html` link appears in the IGB installer window when it asks users to download a new version of IGB. 
The `help.html` link appears when users (in IGB) select *Help > Report a bug or provide feedback*. 

## Logging ##

By default, Apache stores daily logs for one week in `/var/log/httpd`. Access and error logs are both stored. 
When the week rolls over (rotates), the previous week's logs are over-written.

To change this, edit the logrotate configurations, as described below.

Edit `/etc/logrotate.d/httpd`. Default configuration is:

```
/var/log/httpd/*log { 

daily

dateext
    
... }
```

To test changes, execute:

```
logrotate -d /etc/logrotate.d/httpd

```
## Add release directories ##

The main BioViz site contains directories and symbolic links that are not version-controlled.

They are created as part of the IGB release process. 

They include:

* Symbolic link to the current release:

```
igb/releases/current
```

* Release directories containing installers and other artifacts:

```
igb/releases/igb-9.0.0/
igb/releases/igb-9.0.1/
```

* File containing information about any current surveys being done as part of IGB. See IGB code base for details.

```
igb/releases/surveys.xml
```

* IGB Apps directory, at the same level is the `igb` directory. These Apps appear in the IGB App Manager, available from the IGB Tools menu:

```
igbserver/
```

* Support page, used by older versions of IGB.

```
igb/support.html
```


### Questions? ###

Contact Ann Loraine.
