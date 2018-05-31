BioViz.org Web content - version-controlled for easy deployment and testing. 

### About ###

BioViz.org sites have three main goals:

* Serve as a download site for Integrated Genome Browser. 
* Provide links to IGB documentation. 
* Provide a javascript bridge that lets IGB open and display files hosted on external sites (see galaxy.html, bar.html)

**Note**: The javascript bridge functionality is the trickiest to test because you'll need to test against copies of the external sites, or
some kind of simple mockup of their functionality.

To understand how the bridge code works, look at:

* galaxy.html - bridge page for flowing data from [Galaxy](http://usegalaxy.org) into IGB
* js/galaxy.js - Galaxy bridge code
* bar.html - bridge page for flowing data from [BioAnalytic Resource](http://bar.utoronto.ca) RNA-Seq browser into IGB
* js/bar.js - BAR bridge code

### Developing this site ###

The site is designed to be cloned into Web-accessible directories for development, testing, and (ultimately) deployment
on the main bioviz.org site. 

To update or add content, clone this repository and deploy the cloned content using a Web server of your choice.
The directions below assume you are using the Apache Web server and AWS for hosting. 

### Setting up - AWS ###

* Launch micro EC2 image. 

Log into the AWS console and launch one of the pre-configured images. There are many options and most are fine, but pick the smallest 
(and cheapest) option available.

This documentation assumes you're using an Amazon Linux AMI image and CentOS Linux, the first option listed at the
time this documnetatoin was written. 

To find out what Linux variant your EC2 instances is running, view `/etc/

```
$ cat /etc/*release | grep ID_LIKE
ID_LIKE="rhel fedora"
```

* Configure the host. 

Install system updates, the Apache Web server, git, SSL support if you are using it, and whatever editor you prefer. (Dr. Loraine likes emacs.)

```
$ sudo yum update -y 
$ sudo yum install -y git emacs httpd mod_ssl
```

* Configure git. Make an ssh key and add it to your bitbucket user account settings. Tell git to use your Bitbucket user name.

See [documentation](https://confluence.atlassian.com/bitbucket/set-up-an-ssh-key-728138079.html#SetupanSSHkey-ssh2).

```
$ ssh-keygen # makes ~/.ssh/id_rsa.pub, copy this to your bitbucket account
$ git config --global user.name "bbuser" # bitbucket user id
$ git config --global user.email "user@example.com" # your email address
$ sudo git config --global user.name "bbuser" # do it for root user too
$ sudo git config --global user.email "user@example.com" 
```

* Clone this repository into your home directory (~ec2-user) and copy it to the Web servers default `DOCUMENT_ROOT` directory. 

On CentOS this is `/etc/www/html`.

```
$ git clone git@bitbucket.org:lorainelab/bioviz.git
$ sudo mv bioviz /var/www/html/.
```

* Track server configurations with using a *local* git repo. 

It's useful to track changes you make to local configuration files. Use git to create a local
repository out of `/etc/httpd` for tracking configuration changes. If you do this, you can 
easily retrieve older versions for trouble-shooting.

Note that you don't need to do anything with `ssl.conf` unless you need to support https URLs (SSL).

```
$ cd /etc/httpd
$ sudo git init .
$ sudo git add conf/httpd.conf
$ sudo git add conf.d/ssl.conf
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

To see your changes thus far, use `git diff`.

```
]$ git diff httpd.conf 
diff --git a/conf/httpd.conf b/conf/httpd.conf
index 5ec1006..c0b6628 100644
--- a/conf/httpd.conf
+++ b/conf/httpd.conf
@@ -290,7 +290,7 @@ UseCanonicalName Off
 # documents. By default, all requests are taken from this directory, but
 # symbolic links and aliases may be used to point to other locations.
 #
-DocumentRoot "/var/www/html"
+DocumentRoot "/var/www/html/bioviz/htdocs"
 
 #
 # Each directory to which Apache has access can be configured with respect
@@ -315,7 +315,7 @@ DocumentRoot "/var/www/html"
 #
 # This should be changed to whatever you set DocumentRoot to.
 #
-<Directory "/var/www/html">
+<Directory "/var/www/html/bioviz/htdocs">
 
 #
 # Possible values for the Options directive are "None", "All",
```
 
Ask Dr. Loraine to assign your site a bioviz.org subdomain,
e.g., yourname.bioviz.org. If you do that, add the domain name to `/etc/httpd/conf/httpd.conf`.

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

For example, assume the private key is named `star_bioviz_org.key` and the certificates are named `star_bioviz_org.crt` and `DigiCertCA.crt` 
and that you've uploaded them to your user home directory.

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
$ cat /var/log/httpd/access_log
```

* If everything is fine, commit your edits to the configuration files.

```
$ cd /etc/httpd
$ sudo git add conf/httpd.conf
$ sudo git add conf.d/ssl.conf
$ sudo commit -m "Configure site"
```

```

### Questions? ###

Contact Ann Loraine.