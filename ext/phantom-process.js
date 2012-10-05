var port = phantom.args[0],
	webpage = require( "webpage" ),
	page = webpage.create(),
	pageLoaded = false;

page.onConsoleMessage = function( message ){
	console.log( message );
};

page.onConsoleMessage = function( message, line, id ) {
	page.evaluate( function( message, line, id ) {
		if( window.socket ) {
			window.socket.emit( "phantom.console", { message: message, line: line, id: id } );
		}
	}, message, line, id );
};

page.onError = function( message, trace ) {
	page.evaluate( function( message, trace ) {
		if( window.socket ) {
			window.socket.emit( "phantom.error", { message: message, trace: trace } );
		}
	}, message, JSON.stringify( trace ) );
};

page.onResourceRequested = function( resource ) {
	page.evaluate( function() {
		if( window.socket ) {
			window.socket.emit( "phantom.resource.request", { name: resource } );
		}
	} );
};

page.onResourceRequested = function( resource ) {
	page.evaluate( function() {
		if( window.socket ) {
			window.socket.emit( "phantom.resource.request", { name: resource } );
		}
	} );
};

page.onUrlChanged = function() {
	console.log( "url change!" );
};

page.open( "http://localhost:" + port + "/phantom/phantom.html", function( status ) {
	console.log( status );
	pageLoaded = true;
});