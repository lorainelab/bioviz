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

Recommended workflow to update or add content:

* fork this repository
* clone your fork to a staging site (configured as below)
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

**Tip**: To find out what Linux variant your EC2 instance is running, do:

```
cat /etc/*release | grep ID_LIKE
```

* Install software.

Install system updates, the Apache Web server, git, SSL support, and whatever editor you prefer. (Dr. Loraine likes emacs.)

```
sudo yum update -y 
sudo yum install -y git emacs httpd mod_ssl
```

* Configure git. Make an ssh key and add it to your bitbucket user account settings. Tell git to use your Bitbucket user name.

See [documentation](https://confluence.atlassian.com/bitbucket/set-up-an-ssh-key-728138079.html#SetupanSSHkey-ssh2).

```
ssh-keygen # makes ~/.ssh/id_rsa.pub, copy this to your bitbucket account
git config --global user.name "bbuser" # your bitbucket user id
git config --global user.email "user@example.com" # your email address
sudo git config --global user.name "bbuser" # do it for root user too
sudo git config --global user.email "user@example.com" 
```

* Clone this repository into your home directory (~ec2-user) and copy it to the Web servers default web directory. 

On CentOS this is `/etc/www`.

```
git clone git@bitbucket.org:bbuser/bioviz.git # clone your fork
sudo mv bioviz /var/www/. # move cloned repo to Web directories
```

* Configure Apache (httpd) to serve bioviz content from the cloned bioviz/htdocs directory
* Also, start tracking server configurations using a second git repo *local* to your host. (Optional, but highly recommended)

It's useful to track changes you make to local configuration files. If you do this, you can 
easily retrieve older versions for trouble-shooting. Use git to create a local
repository out of `/etc/httpd` for tracking configuration changes. 

```
cd /etc/httpd
sudo git init .
sudo git add conf/httpd.conf conf.d/ssl.conf
sudo git commit -m "Track out of box configurations"
```

* Create a .gitignore file in /etc/httpd. Add and commit it to your local repository.

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

**Note**: To see your changes thus far, use `git diff`.

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
sudo mv ~/star_bioviz_org.key /etc/pki/tls/private/.
sudo mv ~/DigiCertCA.crt /etc/pki/tls/certs/.
sudo mv ~/star_bioviz_org.crt /etc/pki/tls/certs/.
```

* Edit `/etc/httpd/conf.d/ssl.conf` to point to these files. 

```
cd /etc/httpd/conf.d
sudo sed -i 's/#\(SSLCertificateChainFile \/etc\/pki\/tls\/certs\/\)server-chain.crt/\1DigiCertCA.crt/g' ssl.conf
sudo sed -i 's/\(SSLCertificateFile \/etc\/pki\/tls\/certs\/\)localhost.crt/\1star_bioviz_org.crt/g' ssl.conf
sudo sed -i 's/\(SSLCertificateKeyFile \/etc\/pki\/tls\/private\/\)localhost.key/\1star_bioviz_org.key/g' ssl.conf
```

* Use `git diff` to check your changes.

```
git diff ssl.conf
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

* If everything is fine, commit your edits to the configuration files.

```
cd /etc/httpd
sudo git add conf/httpd.conf conf.d/ssl.conf
sudo git commit -m "Configure site"
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

### Questions? ###

Contact Ann Loraine.
