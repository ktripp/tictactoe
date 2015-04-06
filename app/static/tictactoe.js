$(document).ready(function () {
    (function ($) {
        "use strict";

        /**
         * Functionality related to a player.
         */
        var Player = function (symbol, computer) {
            // initialize values based on symbol and player
            var div = computer ? $("#computer") : $("#human");
            var message = computer ? $("#computer p") : $("#human p");
            var turnMessage = computer ? "Computer's turn!" : "Your turn!";
            var winMessage = computer ? "Computer wins!" : "You win!";
            var loseMessage = computer ? "Computer loses!" : "You lose!";

            // private functions to set messaging and classes
            var set = {
                message: function (msg) {
                    message.text(msg);
                },
                turnMessage: function () {
                    set.message(turnMessage);
                },
                winMessage: function () {
                    set.message(winMessage);
                },
                loseMessage: function () {
                    set.message(loseMessage);
                },
                class: function (toggle) {
                    if (toggle) {
                        div.addClass(symbol);
                    } else {
                        div.removeClass(symbol);
                    }
                }
            };

            // initialize values
            set.turnMessage();
            set.class(true);

            return {
                setMessage: function (msg) {
                    set.message(msg);
                },
                setTurnMessage: function () {
                    set.turnMessage();
                },
                setWinMessage: function () {
                    set.winMessage();
                },
                setLoseMessage: function () {
                    set.loseMessage();
                },
                toggleClass: function(toggle) {
                    set.class(toggle);
                },
                div: div,
                symbol: symbol
            };
        };

        /**
         * Functionality related to the game play.
         */
        var s;
        var TicTacToe = {
            settings: {
                players: {
                    computer: new Player("oh", true),
                    human: new Player("ex", false)
                },

                currentPlayer: "ex",

                squares: $(".square"),

                tie: {
                    symbol: "tie",
                    message: "Tie!"
                }
            },

            /**
             * Initializes a game of tic tac toe and allows the human player to start.
             */
            init: function () {
                s = this.settings;

                // add and remove appropriate classes
                $("#start_over").hide();
                s.players.computer.div.hide();

                // enable clicking on squares
                this.enableClicks();

                // set the game state if already in progress
                this.setGameState();
            },

            /**
             * Enables clicking on squares and calls the take turn function
             * upon a click.
             */
            enableClicks: function () {
                s.squares.on("click", this, function (e) {
                    e.data.takeTurn($(this));
                });
            },

            /**
             * Resets the squares to be blank.
             */
            resetSquares: function () {
                // add and remove appropriate classes
                s.squares.each(function () {
                    $(this).removeClass(s.players.human.symbol);
                    $(this).removeClass(s.players.computer.symbol);
                    $(this).removeClass("win");
                    $(this).removeClass("clicked");
                });
                // enable clicking on squares
                this.enableClicks();
            },

            /**
             * Restarts the game on the server side as well as re-setting
             * the UI elements.
             */
            restartGame: function () {
                // get the game state from the server
                $.ajax({
                    url: $SCRIPT_ROOT + '/state',
                    method: "GET",
                    dataType: "json",
                    context: this,
                    success: function (data) {
                        // restart game if it is over
                        if (data.resp.gameState.gameOver) {
                            $.ajax({
                                url: $SCRIPT_ROOT + '/action/restart',
                                method: "PUT",
                                dataType: "json",
                                context: this,
                                success: function () {
                                    // re-initialize game
                                    this.init();

                                    // reset the messaging
                                    s.players.human.setTurnMessage();
                                    s.players.computer.setTurnMessage();

                                    // add and remove appropriate classes
                                    this.resetSquares();

                                    // reset player information
                                    s.currentPlayer = s.players.human.symbol;
                                }
                            });
                        } else {
                            // the game has been restarted in another window
                            this.resetSquares();
                            // reset the messaging
                            $("#start_over").hide();
                            s.players.computer.div.hide();
                            s.players.human.setTurnMessage();
                            s.players.computer.setTurnMessage();
                            s.currentPlayer = s.players.human.symbol;
                            this.setGameState();
                        }
                    }
                });
            },

            setCurrentPlayer: function (player) {
                s.currentPlayer = player;
                if (s.currentPlayer === s.players.human.symbol) {
                    s.players.human.div.show();
                    s.players.computer.div.hide();
                } else {
                    s.players.human.div.hide();
                    s.players.computer.div.show();
                }
            },

            /**
             * Switches between a human and computer player, or vice versa.
             */
            togglePlayer: function () {
                if (s.currentPlayer === s.players.human.symbol) {
                    s.currentPlayer = s.players.computer.symbol;
                } else {
                    s.currentPlayer = s.players.human.symbol;
                }
                s.players.human.div.fadeToggle();
                s.players.computer.div.fadeToggle();
            },

            /**
             * Responds to a human move by asking the server for the next best
             * move and updating the UI elemends accordingly.
             *
             * @param squareId - the ID of the last clicked square
             */
            respond: function (squareId) {
                // disable clicking while computer responds
                s.squares.off("click");

                var data = {};
                if (squareId) {
                    // get the location of the clicked square
                    var loc = squareId.split("");
                    data = { "row": loc[0],
                             "col": loc[1]
                            };
                }
                // request a response from server
                $.ajax({
                    url: $SCRIPT_ROOT + '/action/respond',
                    method: "PUT",
                    dataType: "json",
                    contentType: "application/json",
                    data: JSON.stringify(data),
                    context: this,
                    success: function (data) {
                        // get the computer's response square and mark it
                        var resp = data.resp;
                        var squareId = "#" + resp.row + resp.col;
                        $(squareId).addClass("clicked").addClass(s.currentPlayer);
                        // check the game state and re-enable clicking
                        this.checkGameState(resp.gameState, false);
                    }
                });
            },

            /**
             * Ends the game by updating the UI elements and displaying the
             * "try again?" button.
             *
             * @param winner - the symbol of the winning player
             * @param gameAlreadyStarted - whether or not the game state is being updated
             */
            endGame: function (winner, gameAlreadyStarted) {
                // disable clicking and show the ending messages
                s.squares.off("click");
                if (!gameAlreadyStarted) {
                    s.players.human.div.fadeToggle();
                }

                // update the messaging to show who won
                if (winner === s.players.human.symbol) {
                    s.players.human.setWinMessage();
                    s.players.computer.setLoseMessage();
                } else if (winner === s.players.computer.symbol) {
                    s.players.human.setLoseMessage();
                    s.players.computer.setWinMessage();
                } else if (winner === s.tie.symbol) {
                    s.players.human.setMessage(s.tie.message);
                    s.players.computer.setMessage(s.tie.message);
                }
                s.players.computer.div.show();
                s.players.human.div.show();

                // reset the game if requested
                var game = this;
                setTimeout(function () {
                    var restart = $("#start_over");
                    restart.show("slow");
                    restart.click(function () {
                        setTimeout(function () {
                            game.restartGame();
                        }, 750);
                    });
                }, 2000);
            },

            /**
             * Checks the state of the game and updates the UI based on whether
             * there is a winner, tie, or the game is not yet over.
             *
             * @param state - a dictionary representing the state of the game
             * @param gameAlreadyStarted - whether or not the game state is being updated
             */
            checkGameState: function (state, gameAlreadyStarted) {
                // check for if game is over
                if (state.gameOver) {
                   // if winner highlight the winning squares & set end messaging
                    if (state.winner != s.tie.symbol) {
                        this.endGame(state.winner, gameAlreadyStarted);
                        $.each(state.winLine, function (i) {
                            setTimeout(function () {
                                var id = "#" + state.winLine[i].join("");
                                $(id).addClass("win");
                            }, i * 100);
                        });
                    } else {
                        // if tie set end messaging appropriately
                        this.endGame(s.tie.symbol, gameAlreadyStarted);
                    }
                } else if (!gameAlreadyStarted) {
                    // otherwise take another turn
                    this.togglePlayer();
                    this.enableClicks();
                }
            },

            /**
             * Sets the state of the game and updates the UI based on the server's
             * view of the board.
             */
            setGameState: function (callback) {
                // get the game state from the server
                $.ajax({
                    url: $SCRIPT_ROOT + '/state',
                    method: "GET",
                    dataType: "json",
                    context: this,
                    success: function (data) {
                        // get the state of the board
                        var resp = data.resp;
                        var board = resp.gameState.board;
                        var updatedSquares = [];
                        // set the appropriate classes for each square
                        $.each(board, function (r) {
                            $.each(board, function (c) {
                                var player = board[r][c];
                                if (player != null) {
                                    var id = "#" + r + c;
                                    $(id).addClass("clicked").addClass(player);
                                    updatedSquares.push($(id));
                                }
                            });
                        });
                        // check the game state and keep track of which squares were marked
                        this.checkGameState(resp.gameState, true);
                        if (callback != undefined)
                            return callback(updatedSquares, resp.gameState.gameOver);
                    }
                });
            },

            /**
             * Marks a square as having been clicked by the current player,
             * and requests the server to respond.
             *
             * @param square - a square (div) that was clicked
             */
            takeTurn: function (square) {
                var game = this;
                this.setGameState(function (updatedSquares, gameOver) {
                    var updated = updatedSquares.indexOf(square) > -1;
                    // allow squares to be clicked if they haven't already been chosen
                    if (!gameOver && !updated && !square.hasClass("clicked")) {
                        // mark the square with the correct symbol
                        square.addClass("clicked").addClass(s.currentPlayer);
                        // switch to computer and respond to human
                        game.togglePlayer();
                        game.respond(square[0].id);
                    }
                });
            }
        };

        // initialize the game!
        TicTacToe.init();

    }(jQuery));
});
