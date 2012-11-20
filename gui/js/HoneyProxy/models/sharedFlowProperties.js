/**
 * Contains shared methods of Request and Response objects.
 * Stateless.
 */
define(["dojo/Deferred","dojo/request"],function(Deferred,request){
	var sharedFlowProperties = {
		get httpversion() {
			return this.data.httpversion || [1,0] /* stay compatible with mitmproxy 0.8 */;
		},
		get data() {
			return this._flow.get(this._attr);
		},
		get msg() {
			return this.data.msg;
		},
		get contentLength() {
			return this.data.contentLength;
		},
		get contentChecksums() {
			return this.data.contentChecksums;
		},
		get hasContent() {
			return this.contentLength > 0;
		},
		getContentURL: function(action){
			var url = 
				"/files"
				+"/"+this._flow.get("id")
				+"/"+this._attr
				+"/"+action;
			return url;
		},
		get viewUrl() {
			return this.getContentURL("inline");
		},
		get downloadUrl() {
			return this.getContentURL("attachment");
		},
		getContent: function() {
			if(this.contentLength > 1024 * 1024 * 1){
				if(confirm("This request is pretty big and might cause performance issues ("+this.contentLengthFormatted+") if we load it. Press abort to continue anyway."))
				{
					return (new Deferred())
						.resolve("--- big chunk of data ---");
				}
			}
			if(this.hasContent)
				return request.get(this.viewUrl,{handleAs:"text"});
			else
				return (new Deferred())
					.resolve("");
		},
		get contentLengthFormatted() {
			var attr = this._attr+"ContentLength";
			if(!this._flow.has(attr))
			{
				var prefix = ["B","KB","MB","GB"];
				var size = this.contentLength
				while(size > 1024 && prefix.length > 1){
					prefix.shift();
					size = size / 1024;
				}
				this._flow.set(attr,Math.floor(size)+prefix.shift());
			}
			return this._flow.get(attr);
		},
		getHeader: function(regex){
			var attr = this._attr + "CachedHeaderLookups";
			if(!this._flow.has(attr))
				this._flow.set(attr,{});
			if(!(regex in this._flow.get(attr))) {
				var header = _.find(this.headers, function(header){
					return !!header[0].match(regex);
				});
				this._flow.get(attr)[regex] = header ? header[1] : undefined;
			}
			return this._flow.get(attr)[regex];
			
		},
		get headers() {
			return this.data.headers;
		},
		get timestamp() {
			return this.data.timestamp;
		},
		get date() {
			var attr = this._attr + "Date";
			if(!this._flow.has(attr)) {
				this._flow.set(attr,
						new Date(this.timestamp * 1000));
			}
			return this._flow.get(attr);
		},
		get rawHeader() {
			var attr = this._attr + "RawHeader";
			if(!this._flow.has(attr)){
				//set request header
	        	var rawHeader = this.rawFirstLine;
	        	var headers = this.headers;
	        	for(var i=0;i<headers.length;i++){
	        		rawHeader += headers[i][0]+": "+headers[i][1]+"\n";
	        	}
	        	rawHeader += "\n"; //terminate with \n\n
	        	this._flow.set(attr,rawHeader);
			}
			return this._flow.get(attr);
		}
	};
	return sharedFlowProperties;
});