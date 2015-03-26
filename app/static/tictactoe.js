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
            }
        };

        /**
         * Functionality related to the game play.
         */
        var s;
        var TicTacToe = {
            settings: {
                players: {
                    computer: Player("oh", true),
                    human: Player("ex", false)
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
             * Restarts the game on the server side as well as re-setting
             * the UI elements.
             */
            restartGame: function () {
                // restart the game   
                $.ajax({
                    url: $SCRIPT_ROOT + '/action/restart',
                    method: "PUT",
                    dataType: "json",
                    context: this,
                    success: function (data) {
                        // re-initialize game
                        this.init();

                        // reset the messaging
                        s.players.human.setTurnMessage();
                        s.players.computer.setTurnMessage();

                        // add and remove appropriate classes
                        s.squares.each(function () {
                            $(this).removeClass(s.players.human.symbol);
                            $(this).removeClass(s.players.computer.symbol);
                            $(this).removeClass("win");
                            $(this).removeClass("clicked");
                        });

                        // reset player information
                        s.currentPlayer = s.players.human.symbol;

                        // enable clicking on squares
                        this.enableClicks();
                    }
                });
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
                var game = this;
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
                        var squareId = "#" + resp['row'] + resp['col'];
                        $(squareId).addClass("clicked").addClass(s.currentPlayer);
                        // check the game state and re-enable clicking
                        this.checkGameState(resp['gameState']);
                    }
                });
            },

            /**
             * Ends the game by updating the UI elements and displaying the
             * "try again?" button.
             *
             * @param winner - the symbol of the winning player
             */
            endGame: function (winner) {
                // disable clicking and show the ending messages
                s.squares.off("click");
                s.players.human.div.fadeToggle();

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
                s.players.human.div.show();
                s.players.computer.div.show();

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
             */
            checkGameState: function (state) {
                // check for if game is over
                if (state['gameOver']) {
                   // if winner highlight the winning squares & set end messaging
                    if (state["winner"] != s.tie.symbol) {
                        $.each(state["winLine"], function (i) {
                            setTimeout(function () {
                                var id = "#" + state["winLine"][i].join("");
                                $(id).addClass("win");
                            }, i * 100);
                        });
                        this.endGame(state["winner"]);
                    } else {
                        // if tie set end messaging appropriately
                        this.endGame(s.tie.symbol);
                    }
                } else {
                    // otherwise take another turn
                    this.togglePlayer();
                    this.enableClicks();
                }
            },

            /**
             * Marks a square as having been clicked by the current player,
             * and requests the server to respond.
             *
             * @param square - a square (div) that was clicked
             */
            takeTurn: function (square) {
                // allow squares to be clicked if they haven't already been chosen
                if (!square.hasClass("clicked")) {
                    // mark the square with the correct symbol
                    square.addClass("clicked").addClass(s.currentPlayer)
                    // switch to computer and respond to human
                    this.togglePlayer();
                    this.respond(square[0].id);
                }
            }
        };

        // initialize the game!
        TicTacToe.init();

    }(jQuery));
});
