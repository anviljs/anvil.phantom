var path = require( "path" );
var fs = require( "fs" );
var child = require( "child_process" );

var phantomFactory = function( _, anvil ) {

	var basePath = path.resolve( path.dirname( fs.realpathSync( __filename ) ), "../ext" );

	return anvil.plugin( {
		name: "anvil.phantom",
		clients: [],
		commander: [
			[ "--phantom", "spins up middleware for controlling phantom" ]
		],

		configure: function( config, command, done ) {
			if ( command.phantom ) {
				this.config.phantom = true;
			}
			this.setup();
			done();
		},

		injectControl: function( req, res, next ) {
			if (req.method !== "GET") {
				next();
				return;
			}
			var writeHead = res.writeHead,
				write = res.write,
				end = res.end,
				chunks = [],
				body,
				totalSize = 0,
				serve = function() {
					var original = body.toString();
					if( original.match( /[<][\/]body[>]/ ) ) {
						var modified = original.replace( /[<][\/]body[>]/,
							"<script src=\"/socket.io/socket.io.js\"></script>\n<script src=\"/phantom/client-control.js\"></script>\n</body>"
						);
						res._headers[ "content-length" ] = modified.length;
						res.end( modified );
					} else {
						res.end( body );
					}
				};

			res.write = function( chunk, encoding ) {
				if ( typeof chunk === "string" ) {
					var length;
					if ( !encoding || encoding === 'utf8' ) {
						length = Buffer.byteLength( chunk );
					}
					var buffer = new Buffer( length );
					buffer.write( chunk, encoding );
					chunks.push( buffer );
				} else {
					chunks.push( chunk );
				}
				totalSize += chunk.length;
			};

			res.end = function( chunk, encoding ) {
				if ( chunk && chunk.length ) {
					res.write( chunk, encoding );
				}
				body = new Buffer( totalSize );
				var offset = 0;
				chunks.forEach( function( chunk ) {
					chunk.copy( body, offset );
					offset += chunk.length;
				});
				res.writeHead = writeHead;
				res.write = write;
				res.end = end;
				serve();
			};
			next();
		},

		open: function( url ) {
			this.phantomSocket.emit( "phantom.open", { url: url } );
		},

		setup: function() {
			var host = anvil.plugins[ "anvil.http" ];
			if( host && host.app ) {
				host.app.use( this.injectControl );
				host.on( "socket.connected", function( socket ) {
					socket.on( "phantom.hosted", function() {
						self.setupSocket( socket );
					} );
				} );
				anvil.phantom = {
					open: this.open
				};
				if( this.config.phantom ) {
					host.registerPath( "/phantom/", path.join( basePath ) );
					host.app.get( /[.]html$/, this.injectControl );
					this.phantom = this.spawn( host.config.port );
				}
			} else {

			}
		},

		setupSocket: function( socket ) {
			this.phantomSocket = socket;
			var self = this,
				handlers = {
					"phantom.console": function( obj ) {
						anvil.log.debug( "phantom client: " + obj.message );
					},
					"phantom.error": function( obj ) {
						anvil.log.warning( "phantom client: " + obj.error + "\n" +obj.trace );
					}
				};
			_.each( handlers, function( handler, topic ) {
				socket.on( topic, handler );
			} );
			socket.emit( "phantom.test", {} );
		},

		spawn: function( port ) {
			anvil.log.debug( "Spawning phantomjs instance" );
			var phantom = child.spawn( "phantomjs", [ path.join( basePath, "phantom-process.js" ), port ] );
			phantom.stdout.on( "data", function( data ) {
				return anvil.log.debug( "phantom: " + data );
			});
			phantom.stderr.on( "data", function( data ) {
				return anvil.log.warning( "phantom: " + data );
			});
			return phantom;
		}
	} );
};

module.exports = phantomFactory;