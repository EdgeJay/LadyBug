(function ($) {

	var game;

	$(document).ready(function (evt) {

		/*
		// Use following code if need to test for different viewport sizes
		game = new Game('#game-canvas', {
			width: 320,
			height: 480
		});
		*/
		game = new Game('#game-canvas');
		game.start(function (g) {
			
			console.log('Game initialized!');
			console.log('Canvas size:', game.canvasSize().width, game.canvasSize().height);

		});
		game.enableStats();
	});
})(jQuery);
