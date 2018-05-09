BioViz.org Web content - version-controlled for easy deployment.

### About ###

The site serves three functions:

* Download site for Integrated Genome Browser, target for automatic build process.
* Provides javascript bridge for Galaxy users (see galaxy.html).
* Links to IGB documentation, including users guide, developers guide, etc.

### Setting up - AWS ###

* Launch micro EC2 image.

Amazon Linux AMI image is fine, e.g,

```
$ cat /etc/*release | grep ID_LIKE
ID_LIKE="rhel fedora"
```

* Configure server. Install Web server, git, an editor you like.

```
sudo yum update
sudo yum install git
sudo yum install emacs 
sudo yum install httpd
```

* Clone repository in Web directory.

```
cd /var/www/html/
sudo git clone https://aloraine@bitbucket.org/lorainelab/bioviz.git
```

* Use git (local repository) to track site configuration changes. 

```
cd /etc/httpd
git init .
git add conf/httpd.conf
```

* For future convenience, create a .gitignore file

```
*~
*#
logs
run
module
```

* Edit httpd.conf. 

```
some stuff
```


Whe

sudo git clone https://aloraine@bitbucket.org/lorainelab/bioviz.git
```
* Install Apache.
* Clone repository.
* Edit httpd.conf: Set DocumentRoot to htdocs directory

### Contact ###

* Ann Loraine