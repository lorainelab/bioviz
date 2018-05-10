BioViz.org Web content - version-controlled for easy deployment and testing. 

### About ###

The site has three main goals:

* Serve as a download site for Integrated Genome Browser. 
* Provide links to IGB documentation. 
* Provide a javascript bridge that lets users open files hosted on external sites (see galaxy.html, bar.html)

The javascript bridge functionality is the trickiest to test because you'll need test copies of the external sites, or
some kind of simple mockup of their functionality.

To understand how this works, look at:

* galaxy.html - bridge page for flowing data from Galaxy into IGB
* js/galaxy.js - Galaxy bridge code
* bar.html - bridge page for flowing data from [BioAnalytic Resource](http://bar.utoronto.ca) RNA-Seq browser into IGB
* js/bar.js - BAR bridge code

### Developing this site ###

The site is designed to be cloned into Web-accessible directories for development, testing, and deployment
on the main bioviz.org site. 

To update or add content, clone this repository and deploy the cloned content using a Web server of your choice.
The directions below assume you are using the Apache Web server and AWS for hosting. 

### Setting up - AWS ###

- Launch micro EC2 image. Amazon Linux AMI image is fine. This example assumes you are running CentoOS, e.g.,

```
$ cat /etc/*release | grep ID_LIKE
ID_LIKE="rhel fedora"
```

Configure the host. Install system updates, the Apache Web server, git, SSL support if you are using it, and whatever editor you prefer. (Dr. Loraine likes emacs.)

```
sudo yum update
sudo yum install git
sudo yum install emacs 
sudo yum install httpd
```

Clone this repository. The `htdocs` directory will become the Web server's DOCUMENT_ROOT.

```
cd /var/www/html/
sudo git clone https://your.user@bitbucket.org/lorainelab/bioviz.git
```

It's useful to tracks changes you make to local configuration files. Use git to create a local
repository in `/etc/httpd` for saving configurations you make to the server. 

Note that you don't need to do anything with ssl.conf unless you need to support https URLs (SSL).

```
cd /etc/httpd
git init .
git add conf/httpd.conf
git add conf.d/ssl.conf
git commit -m "Track changes to httpd configuration files httpd.conf and ssl.conf"
```

For convenience, create a .gitignore file in /etc/httpd. Add it to your local repository.

```
*~
*#
logs
run
module
```

Edit httpd.conf to configure the site. The default document root is /var/www/html. Change
this /var/www/html/bioviz/htdocs.

```
cd /etc/httpd/conf
sed -i 's/var\/www\/html/var\/www\/html\/bioviz\/htdocs/g' httpd.conf
```

If you're supporting https URLs (SSL), you'll need to install three files: 

* a signed certificate issued for you from a trusted signing authority like Digicert
* your server's private key, created when you made the certificate signing request for the signing authority
* the signed certificate from the signing authority

See also: (Digicert documentation)[https://www.digicert.com/csr-ssl-installation/apache-openssl.htm] on how to configure SSL.

Transfer the files to the server. Put the private key file (.key) in `/etc/pki/tls/private` and the two certificate files (.crt) in `/etc/pki/tls.private`.



### Contact ###

* Ann Loraine