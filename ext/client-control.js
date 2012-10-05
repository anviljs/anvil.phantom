var socket, port;
port = window.location.port;
socket = io.connect( "http://" + document.domain + ':' + port + '/' );
window.socket = socket;

var handlers = {
	"phantom": function( obj ) {
		socket.emit( 'phantom.hosted', {} );
	},
	"phantom.open": function( obj ) {
		window.location = obj.url;
	},
	"phantom.test": function( obj ) {
		console.log( "testing phantom setup" );
	},
	"connect_failed": function() {
		console.log( "Could not connect to anvil", "error" );
	},
	"disconnect": function() {
		console.log( "Anvil server has disconnected", "error" );
	},
	"refresh": function() {
		window.location.reload();
	},
	"reconnect": function() {
		console.log( "Reconnection to anvil succeeded" );
	},
	"reconnecting": function() {
		console.log( "Lost connection to anvil, attempting to reconnect", "warning" );
	},
	"reconnect_failed": function() {
		console.log( "Reconnected to anvil failed", "error" );
	}
};

socket.on( 'connect', function () {
	for( var key in handlers ) {
		socket.on( key, handlers[ key ] );
	}
} );