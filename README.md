# emerge2016
interactive installation for for the emerge 2016 launch pad ( Linux only atm )

## dependencies
* [nodejs](https://nodejs.org/)
* [mongodb](https://www.mongodb.org/)
* [libfreenect](https://github.com/OpenKinect/libfreenect) ( see [node-kinect](https://github.com/nguyer/node-kinect/blob/master/README.md) )
* ...possibly also [libusb](http://www.libusb.org/)

## running the installation

make sure to `npm install` in both the installation && microsite folders to download node dependencies

create a "db" folder inside data/  

then launch the mongodb server

```sh
    mongod --dbpath=/path/to/emerge2016/data/db --logpath=/path/to/emerge2016/data/db/mongod.log
```

then launch the kinect-daemon ( inside installation/kinect-daemon/ ), at the moment this requires node v.0.10.42 ( we recommend using nvm [node version manager] )

```sh
    sudo /path/to/.nvm/v0.10.42/bin/node server
```

then launch the installation app ( inside installation/ )

```sh
    ./node_modules/nw/bin/nw
```

