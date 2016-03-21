function OpticalFlowField(width, height, zoneSize, debug) {

    this.cutoff = 1000;
    this.v = 0;
    this.u = 0;

    this.depthCanvas = document.createElement('canvas');
    this.depthCanvas.width = width;
    this.depthCanvas.height = height;
    this.depthContext = this.depthCanvas.getContext('2d');
    // document.body.appendChild(this.depthCanvas);
      
    this.imageData = this.depthContext.createImageData(width, height);
    
    if (debug) {
        this.debugCanvas = document.createElement('canvas');
        this.debugCanvas.width = width;
        this.debugCanvas.height = height;
        this.debugContext = this.debugCanvas.getContext('2d');
        document.body.appendChild(this.debugCanvas);
    }
      
    this.canvas = document.createElement('canvas');
    this.canvas.width = Math.floor(width / (zoneSize * 2 - 1));
    this.canvas.height = Math.floor(height / (zoneSize * 2 - 1));
    this.context = this.canvas.getContext('2d');
    this.canvas.style.width = '155px';
    this.canvas.style.height = '120px';
    document.body.appendChild(this.canvas);
        
    this.canvasFlow = new oflow.CanvasFlow(this.depthCanvas, zoneSize);
    var self = this;
    var maxLength = new BB.Vector2(-(zoneSize * 2 + 1), zoneSize * 2 + 1).length();
    this.canvasFlow.onCalculated(function (direction) {

        self.u = direction.u;
        self.v = direction.v;

        // render zones
        if (debug) {
            self.debugContext.fillStyle = '#000';
            self.debugContext.fillRect(0, 0, self.debugCanvas.width, self.debugCanvas.height);
        }
        
        self.context.fillStyle = "#fff";
        self.context.fillRect(0, 0, self.canvas.width, self.canvas.height);

        for(var i = 0; i < direction.zones.length; ++i) {
           
           // fill flow debug context
            var zone = direction.zones[i];
            var color = getDirectionalColor(zone.u, zone.v);
            
            if (debug) {
                self.debugContext.strokeStyle = color;
                self.debugContext.beginPath();
                self.debugContext.moveTo(zone.x,zone.y);
                self.debugContext.lineTo((zone.x - zone.u), zone.y + zone.v);
                self.debugContext.stroke();
            }

            // fill difference texture
            // for some reason empty background fills red, switch this to black
            if (color === 'rgba(255,0,0,1)') {
                color = 'rgba(255,255,255,1)';
            } else {
                // zone.u and zone.y are values between -(zoneSize * 2 + 1) and (zoneSize * 2 + 1), 
                // so to calculate the magnitude of the vector 
                var len = new BB.Vector2(zone.u, zone.v).length();

                var alpha = BB.MathUtils.map(len, 0, maxLength, 0.0, 1.0);
                // var alpha = BB.MathUtils.map((Math.abs(zone.u) + Math.abs(zone.v)), 0, (zoneSize * 2 + 1) * 2, 0.0, 1.0);
                // var alpha = vec.alphaanceTo(new BB.Vector2(zone.u, zone.v)) // / Math.floor(zoneSize * 2 + 1);
                // var alpha = BB.MathUtils.map(((new BB.Vector2(zone.u - zone.x, zone.v - zone.y)).length() % zoneSize * 2 + 1), 0, 17, 0.0, 1.0);
                // if (alpha < 0.1) console.log(alpha);
                // alphas.push(alpha);
                color = color.split(',');
                color[color.length - 1] = alpha + ')';
                color = color.join(',')

                self.context.fillStyle = color;
                self.context.fillRect(zone.x / (self.depthCanvas.width / self.canvas.width),
                                    zone.y / (self.depthCanvas.height / self.canvas.height), 1, 1);
            }
        }        
    });
    
    this.canvasFlow.startCapture();

    function fromArgb(a, r, g, b) {
        return 'rgba(' + [r, g, b, a/255].join(',') + ')';
    }
      
    function convertHsvToRgb(h, s, v) {
        var a, b, c, d, hueFloor;
        h = h / 360;
        if (s > 0) {
            if (h >= 1) {
                h = 0;
            }
            h = 6 * h;
            hueFloor = Math.floor(h);
            a = Math.round(255 * v * (1.0 - s));
            b = Math.round(255 * v * (1.0 - (s * (h - hueFloor))));
            c = Math.round(255 * v * (1.0 - (s * (1.0 - (h - hueFloor)))));
            d = Math.round(255 * v);

            switch (hueFloor) {
                case 0: return fromArgb(255, d, c, a);
                case 1: return fromArgb(255, b, d, a);
                case 2: return fromArgb(255, a, d, c);
                case 3: return fromArgb(255, a, b, d);
                case 4: return fromArgb(255, c, a, d);
                case 5: return fromArgb(255, d, a, b);
                default: return fromArgb(0, 0, 0, 0);
            }
        }
        d = v * 255;
        return fromArgb(255, d, d, d);
    }

    var toDegree = 180 / Math.PI;
    function getDirectionalColor(x, y) {
        var hue = (Math.atan2(y, x) * toDegree + 360) % 360;
        return convertHsvToRgb(hue, 1, 1);
    }
}

OpticalFlowField.prototype.addFrame = function(pixels) {
    
    var i = 0;
    var j = 0;

    for (var y = 0; y < this.depthCanvas.height; y++) {
        for (var x = 0; x < this.depthCanvas.width; x++) {
            
            var val = pixels[j + 1] << 8 | pixels[j];
            val = BB.MathUtils.map(val, 0, this.cutoff, 255, 0);

            this.imageData.data[i + 0] = val;
            this.imageData.data[i + 1] = val;
            this.imageData.data[i + 2] = val;
            this.imageData.data[i + 3] = 255;

            j += 2;
            i += 4;
        }
    }

    this.depthContext.putImageData(this.imageData, 0, 0);
}

