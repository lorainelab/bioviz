[BioViz.org](https://bioviz.org) Web content - version-controlled for easy deployment and testing. 

### About ###

BioViz.org sites:

* Distribute Integrated Genome Browser installers (free download, see igb/releases), 
* Link to IGB documentation, and
* Implement a javascript bridge that channels data from external sites into IGB.

**Note**: The javascript bridge functionality is the trickiest to test because you'll need to test against live copies or mockups of the external sites.

To understand bridge code, look at:

* galaxy.html - bridge page for flowing data from [Galaxy](http://usegalaxy.org) into IGB
* js/galaxy.js - Galaxy bridge code
* bar.html - bridge page for flowing data from [BioAnalytic Resource](http://bar.utoronto.ca) RNA-Seq browser into IGB
* js/bar.js - BAR bridge code

### Developing this site ###

The site is designed to be deployed as-is into Web-accessible directories for development, testing, and (ultimately) deployment
via git pull commands on the main bioviz.org site. 

To update or add content:

* fork this repository
* clone your fork onto a staging site (configured as below)
* make a branch on your staging site and edit 
* check edits by visiting your staging site in a Web browser 
* push the branch to your fork
* issue a pull request from your branch to master on the team (main) repo

**Note**: Make note of your staging site URL in your pull request.

**Note**: If you deploy as described below, your edits will appear on the staging site automatically. 

### Setting up a staging site ###

The directions below assume you are using the Apache Web server and AWS for hosting. 

* Launch micro EC2 image. 

Log into the AWS console and launch one of the pre-configured images. There are many options and most are fine, but pick the smallest 
(and cheapest) option available.

This documentation assumes you're using an Amazon Linux AMI image and CentOS Linux.

**Tip**: To find out what Linux variant your EC2 instances is running, do:

```
$ cat /etc/*release | grep ID_LIKE
ID_LIKE="rhel fedora"
```

* Install software.

Install system updates, the Apache Web server, git, SSL support if you are using it, and whatever editor you prefer. (Dr. Loraine likes emacs.)

```
$ sudo yum update -y 
$ sudo yum install -y git emacs httpd mod_ssl
```

* Configure git. Make an ssh key and add it to your bitbucket user account settings. Tell git to use your Bitbucket user name.

See [documentation](https://confluence.atlassian.com/bitbucket/set-up-an-ssh-key-728138079.html#SetupanSSHkey-ssh2).

```
$ ssh-keygen # makes ~/.ssh/id_rsa.pub, copy this to your bitbucket account
$ git config --global user.name "bbuser" # you bitbucket user id
$ git config --global user.email "user@example.com" # your email address
$ sudo git config --global user.name "bbuser" # do it for root user too
$ sudo git config --global user.email "user@example.com" 
```

* Clone this repository into your home directory (~ec2-user) and copy it to the Web servers default `DOCUMENT_ROOT` directory. 

On CentOS this is `/etc/www/html`.

```
$ git clone git@bitbucket.org:bbuser/bioviz.git # clone your fork
$ sudo mv bioviz /var/www/html/. # move cloned repo to Web directories
```

* Configure Apache (httpd) to serve bioviz content from the cloned bioviz/htdocs directory
* Also, start tracking server configurations using a second git repo *local* to your host. (Optional, but highly recommended)

It's useful to track changes you make to local configuration files. If you do this, you can 
easily retrieve older versions for trouble-shooting. Use git to create a local
repository out of `/etc/httpd` for tracking configuration changes. 

Note that you don't need to do anything with `ssl.conf` unless you need to support https URLs (SSL). However, the main bioviz site
is using https, so you should, too.

These instructions assume you will configure the site to use SSL.

```
$ cd /etc/httpd
$ sudo git init .
$ sudo git add conf/httpd.conf conf.d/ssl.conf
$ sudo git commit -m "Track out of box configurations"
```

* For convenience, create a .gitignore file in /etc/httpd. Add and commit it to your local repository.

.gitignore:

```
*~
*#
logs
run
modules
notrace.conf
README
welcome.conf
conf/magic
module
```

* Edit `httpd.conf` to configure the site. If you make a mistake, use git checkout to recover the original version.

The default document root is `/var/www/html`. Change this to `/var/www/html/bioviz/htdocs`. 

```
$ cd /etc/httpd/conf
$ sudo sed -i 's/\(var\/www\/html\)/\1\/bioviz\/htdocs/g' httpd.conf
```

**Note**: To see your changes thus far, use `git diff`.

* Ask Dr. Loraine to assign your site a bioviz.org subdomain, e.g., yourname.bioviz.org. If you do that, add the domain name to `/etc/httpd/conf/httpd.conf`.

The following example assumes the server's name is test.bioviz.org. 

```
$ cd /etc/httpd/conf
$ sudo sed -i 's/#ServerName www.example.com:80/ServerName test.bioviz.org:80/g' httpd.conf
```

* Check your changes thus far. 

```
$ sudo service httpd configtest
Syntax OK
```

## Supporting https URLs (SSL) ##

If you're supporting https URLs (SSL), you'll need to install three files: 

1) signed certificate (.crt) file issued for you from a trusted signing authority like Digicert
2) your server's private key, created when you made the certificate signing request for the signing authority
3) signed certificate (.crt) file from the signing authority

See also: [Digicert documentation](https://www.digicert.com/csr-ssl-installation/apache-openssl.htm) on how to configure SSL.

* Transfer the files to the server. 

Put the private key file (.key) in `/etc/pki/tls/private` and the two certificate files (.crt) in `/etc/pki/tls.private`.

For example, assume the private key file is `star_bioviz_org.key`, the certificates files are `star_bioviz_org.crt` and `DigiCertCA.crt`,
and both are in your user home directory.

```
$ sudo mv ~/star_bioviz_org.key /etc/pki/tls/private/.
$ sudo mv ~/DigiCertCA.crt /etc/pki/tls/certs/.
$ sudo mv ~/star_bioviz_org.crt /etc/pki/tls/certs/.
```

* Edit `/etc/httpd/conf.d/ssl.conf` to point to these files. 

```
$ cd /etc/httpd/conf.d
$ sudo sed -i 's/#\(SSLCertificateChainFile \/etc\/pki\/tls\/certs\/\)server-chain.crt/\1DigiCertCA.crt/g' ssl.conf
$ sudo sed -i 's/\(SSLCertificateFile \/etc\/pki\/tls\/certs\/\)localhost.crt/\1star_bioviz_org.crt/g' ssl.conf
$ sudo sed -i 's/\(SSLCertificateKeyFile \/etc\/pki\/tls\/private\/\)localhost.key/\1star_bioviz_org.key/g' ssl.conf
```

As before, use `git diff` and `service httpd configtest` to confirm and check your changes.

```
$ git diff ssl.conf
$ sudo service httpd configtest
```

* Start the server and test it.

```
$ sudo service httpd start
```

* Test by visting the site in your Web browser. 

If you don't see the BioViz content, look at the server logs to diagnose the problem.

```
$ sudo cat /var/log/httpd/error_log
$ sudo cat /var/log/httpd/access_log
```

* If everything is fine, commit your edits to the configuration files.

```
$ cd /etc/httpd
$ sudo git add conf/httpd.conf conf.d/ssl.conf
$ sudo git commit -m "Configure site"
```

* Configure upstream repository (for synchronizing with the team repository)

Add the main (team) BioViz repository to your clone as a new remote called upstream. 

```
$ cd /etc/httpd/www/bioviz
$ git remote add upstream git@bitbucket.org:lorainelab/bioviz.git
```

* Other conveniences

It's nice to have an alias that lets you change quickly into your cloned repository. Add an alias to your .bash_profile file:

```
echo 'alias go="cd /var/www/html/bioviz/htdocs"' >> ~/.bash_profile
```

If you like emacs, make it your default editor:

```
echo 'export EDITOR=emacs` >> ~/.bash_profile'
```


## Set up logging for your site ##

The default logging system has daily log setup for http files.

To edit the current logrotate configurations, follow the steps below.

Open the file (/etc/logrotate.d/httpd) in write mode and we can see the current config as

```
/var/log/httpd/*log

{ config1 config 2 and so on... }
```

Add <exampleConfig> as parameter to the above block,

```
/var/log/httpd/*log

{ exampleConfig config1 config2... } and save the file.
```

To test the changes, execute

```
logrotate -d /etc/logrotate.d/httpd
```

This should update the configurations of log rotation.

You can see detailed instructions and configuration parameters [here](https://www.techrepublic.com/article/manage-linux-log-files-with-logrotate/).



## Test your knowledge ##

To make sure you understand the site and how to update it, do this:

* Add your name to the list of contributors on the BioViz Web site. Then issue a pull request.

Good luck!

### Questions? ###

Contact Ann Loraine.