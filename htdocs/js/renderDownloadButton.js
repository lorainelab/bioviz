$(window).on("load",function (e) {
    var parser = new UAParser();
    var os = parser.getOS().name;
    var systemConfig = parser.getCPU();
    if (os == "Linux" || os == "CentOS" || os == "Fedora" || os == "FreeBSD" || os == "Debian" || os == "DragonFly" || os == "RedHat" || os == "Mint" || os == "GNU" || os == "Ubuntu") {
        $("#linuxDownload .btn").removeClass('d-none');
    }
    if (os == "Windows [Phone/Mobile]" || os == "Windows") {
        if (systemConfig.architecture == "amd64" || systemConfig.architecture == "ia64" || systemConfig.architecture == "arm64" || systemConfig.architecture == "irix64" || systemConfig.architecture == "mips64" || systemConfig.architecture == "sparc64") {
            $("#windows64Download .btn").removeClass('d-none');
        } else {
            $("#windows64Download .btn").removeClass('d-none');
            $("#windows32Download .btn").removeClass('d-none');
        }
    }
    if (os == "Mac OS X" || os == "Mac OS") {
        $("#osxDownload .btn").removeClass('d-none');
    }
});
