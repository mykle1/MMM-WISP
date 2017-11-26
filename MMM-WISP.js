 /* Magic Mirror
  * Module: MMM-WISP
  *
  * By Mykle1
  * 
  */
Module.register("MMM-WISP", {

    // Module config defaults.
    defaults: {
		ICAO: "KJFK,EGLL,UUDD,EDDT,RJAA,ZBAA,LFPG,LIRF",  // separated by comma only
		colorCode: "Standard", // Standard or Alternative
		maxWidth: "100%",
		useHeader: false,
		header: "",
		rotateInterval: 15 * 1000, // seconds
		updateInterval: 10 * 60 * 1000, // every 10 minutes
		animationSpeed: 3000,
		initialLoadDelay: 1875, // of module
		retryDelay: 1500,
    },


    getStyles: function() {
        return ["MMM-WISP.css"];
    },


    // Define start sequence.
    start: function() {
        Log.info("Starting module: " + this.name);

        // Set locale.
        this.url = "https://aviationweather.gov/adds/dataserver_current/httpparam?dataSource=metars&requestType=retrieve&format=xml&stationString=" + this.config.ICAO + "&hoursBeforeNow=1",
		this.WISP = [];
		this.activeItem = 0;
        this.rotateInterval = null;
        this.scheduleUpdate();
    },


    getDom: function() {
		
        var wrapper = document.createElement("div");
        wrapper.className = "wrapper";
        wrapper.style.maxWidth = this.config.maxWidth;


        if (!this.loaded) {
            wrapper.classList.add("wrapper");
            wrapper.innerHTML = "Loading WISP . .";
            wrapper.className = "bright light small";
            return wrapper;
        }

		 
		if (this.config.useHeader != false) {
            var header = document.createElement("header");
            header.classList.add("xsmall", "bright", "header");
            header.innerHTML = this.config.header;
            wrapper.appendChild(header);
        }
		
		
		//	Rotating my data
        var WISP = this.WISP;
        var WISPKeys = Object.keys(this.WISP);
        if (WISPKeys.length > 0) {
            if (this.activeItem >= WISPKeys.length) {
                this.activeItem = 0;
        }
        var WISP = this.WISP[WISPKeys[this.activeItem]];


		// start config opton for color coding flight category/rules bullet
		if (this.config.colorCode != "Standard"){
		// Alternative color coding flight category/rules bullet
		if (WISP.flight_category == "VFR"){
			var bullet = '<font color = green> &#x29BF </font>';
		} else if (WISP.flight_category == "MVFR"){
			var bullet = '<font color = blue> &#x29BF </font >';
		} else if (WISP.flight_category == "IFR"){
			var bullet = '<font color = red> &#x29BF </font>';
		} else if (WISP.flight_category == "LIFR"){
			var bullet = '<font color = magenta> &#x29BF </font>';
		} else {
			var bullet = '<font color = grey> &#x29BF </font>';
		}
	} else {
		// Standard color coding flight category/rules bullet
		if (WISP.flight_category == "VFR"){
			var bullet = '<font color = blue> &#x29BF </font>';
		} else if (WISP.flight_category == "MVFR"){
			var bullet = '<font color = green> &#x29BF </font >';
		} else if (WISP.flight_category == "IFR"){
			var bullet = '<font color = yellow> &#x29BF </font>';
		} else if (WISP.flight_category == "LIFR"){
			var bullet = '<font color = red> &#x29BF </font>';
		} else {
			var bullet = '<font color = grey> &#x29BF </font>';
		}
		
	}   // <-- end config option for color coding flight category/rules bullet
		
        
		// if cloud_base_ft_agl is missing, display nothing
		if(WISP.sky_condition[0]["$"].cloud_base_ft_agl == undefined){
			WISP.sky_condition[0]["$"].cloud_base_ft_agl = "";
		}
		
		
		var top = document.createElement("div");
        top.classList.add("list-row");
		
        var synopsis = document.createElement("div");
        synopsis.classList.add("small", "bright", "synopsis");
        synopsis.innerHTML =
			bullet + " &nbsp "
			+ WISP.station_id + " &nbsp &nbsp "
			+ WISP.wind_dir_degrees + "@"
			+ WISP.wind_speed_kt + "kt" + " &nbsp  &nbsp "
			+ Math.round(WISP.visibility_statute_mi) + "SM" + " &nbsp &nbsp "
			+ WISP.sky_condition[0]["$"].sky_cover
			+ WISP.sky_condition[0]["$"].cloud_base_ft_agl + " &nbsp &nbsp "
			+ Math.round(WISP.temp_c) + "/"
			+ Math.round(WISP.dewpoint_c) + " &nbsp &nbsp  "
			+ Math.round(WISP.altim_in_hg) + "hg" + " &nbsp &nbsp  "
			+ WISP.observation_time
			; 
        top.appendChild(synopsis);
		 
        wrapper.appendChild(top);
		 
		} // <-- closes rotation loop
		
        return wrapper;

	},  // <-- closes the getDom function


	processWISP: function(data) { 
		this.WISP = data[0].METAR;  // take this down to just before what I really need
	//	console.log(this.WISP); // for checking 
		this.loaded = true;
	},
	 
	scheduleCarousel: function() {
    //   console.log("WISP Carousel"); // for checking
        this.rotateInterval = setInterval(() => {
            this.activeItem++;
            this.updateDom(this.config.animationSpeed);
        }, this.config.rotateInterval);
    },

    scheduleUpdate: function() {
        setInterval(() => {
            this.getWISP();
        }, this.config.updateInterval);
        this.getWISP(this.config.initialLoadDelay);
        var self = this;
    },

    getWISP: function() {
        this.sendSocketNotification('GET_WISP', this.url);
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "WISP_RESULT") {
            this.processWISP(payload);
            if (this.rotateInterval == null) {
                this.scheduleCarousel();
            }
            this.updateDom(this.config.animationSpeed);
        }
        this.updateDom(this.config.initialLoadDelay);
    },

});