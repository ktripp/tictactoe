#!/usr/bin/env python

from copy import deepcopy

# symbol constants
EX = "ex"
OH = "oh"
TIE = "tie"

def getOppositePlayer(player):
    """
    Given a player EX or OH, returns the alternate player.
    """
    return OH if player == EX else EX

class TicTacToe:
    """
    Represents a Tic Tac Toe game.
    """
    def __init__(self, human=EX):
        """
        Creates a new Tic Tac Toc game with a 3x3 board.
        The human player will by default be given "X" unless otherwise specified.
        The game keeps track of the row, column, and player of the last move made.
        """
        assert human == EX or human == OH
        self.board = [[None, None, None],
                      [None, None, None],
                      [None, None, None]]
        self.lastMove = None
        self.human = human
        self.computer = getOppositePlayer(human)
        self.firstMove = True

    def __str__(self):
        """
        Prints out a representation of the board
        """
        return "\n".join("".join([self._formatItem(item) for item in row])
            for row in self.board)

    def _formatItem(self, item):
        """
        Internal helper function for printing.
        """
        printableValue = "X"
        if item == OH: printableValue = "O"
        return '{:^3}'.format(printableValue) if item is not None else " - "

    def move(self, row, col, player=None):
        """
        Places a player's symbol on the board at the given row and column.
        """
        if player is None: player = self.human
        assert row >= 0 and row < 3
        assert col >= 0 and col < 3
        self.board[row][col] = player
        self.lastMove = (row, col, player)

    def respondToMove(self, player=None):
        """
        Responds to the last move by using the minimax algorithm to choose
        the best spot to play, and returns the row and column of that spot.
        """
        if player is None: player = self.computer

        if self.firstMove:
            return self.respondToFirstMove(player)

        loc = Minimax.findNextMove(self, player)
        if loc is None:
            return None
        row, col = loc
        self.move(row, col, player)
        return row, col

    def respondToFirstMove(self, player):
        self.firstMove = False
        (r, c, _) = self.lastMove
        # if in center, place in corner
        if r == 1 and c == 1:
            self.move(0, 0, player)
            return 0, 0
        # otherwise place in center
        else:
            self.move(1, 1, player)
            return 1, 1

    def checkForWin(self, line):
        """
        Determines whether or not a list of three symbols
        is a winning line (all three symbols are the same).
        """
        return None not in line and len(set(line)) == 1

    def isInDiagonal(self, row, col):
        """
        Determines whether or not a given location is part
        of a diagonal line (i.e. a corner or a middle spot).
        """
        return row == col or row + col == 2

    def checkDiagonals(self):
        """
        Checks the diagonal lines for a win.
        Returns a list of spot coordinates if the diagonal is a win.
        """
        left = [(0, 0), (1, 1), (2, 2)]
        right = [(0, 2), (1, 1), (2, 0)]
        if self.checkForWin([self.board[r][c] for r, c in left]): return left
        if self.checkForWin([self.board[r][c] for r, c in right]): return right
        return None
 
    def isOver(self):
        """
        Determines whether or not the game is over (a tie or a win).
        Returns a tuple representing the state of game:
            (isOver, symbol, [locations])
                isOver - True if the game is a win or a tie, False otherwise
                symbol - the symbol of the winning player, or TIE if it is a tie
                locations - a list of tuples of rows and columns of the winning squares
        We only have to check the lines containing the location of the last move.
        """
        # if this is the first move we aren't done yet!
        if self.lastMove is None: return False, None, None

        # get the last move and player that did it
        (r, c, winner) = self.lastMove
        # check row containing last move
        row = self.board[r]
        if self.checkForWin(row):
            return True, winner, [(r, i) for i in range(len(row))]

        # check column containing last move
        col = zip(*self.board)[c]
        if self.checkForWin(col):
            return True, winner, [(i, c) for i in range(len(col))]

        # check diagonals containing last move
        if self.isInDiagonal(r, c):
            diag = self.checkDiagonals()
            if diag is not None:
                return True, winner, diag

        # check for tie - if all squares are filled
        if None not in [col for row in self.board for col in row]:
            return True, TIE, None
        
        # if we haven't won or tied, we aren't done
        return False, None, None

    def getGameState(self):
        """
        Returns a dictionary representing the current state of the game.
            gameOver - True if the game is a win or a tie, False otherwise
            winner - the symbol of the winning player (EX or OH), TIE if it is a tie, else None
            winLine - a list of tuples of rows and columns of the winning squares, if a win
        """
        if self.lastMove == None:
            currentPlayer = self.human
        else:
            currentPlayer = getOppositePlayer(self.lastMove[2])
        (isOver, winner, line) = self.isOver()
        return {"board": self.board,
                "currentPlayer": currentPlayer,
                "gameOver": isOver,
                "winner": winner,
                "winLine": line}

    def getAvailableMoves(self):
        """
        Returns a list of tuples representing squares that are not yet taken.
        """
        moves = []
        for r in range(len(self.board)):
            row = self.board[r]
            for c in range(len(row)):
                if row[c] is None:
                    moves.append((r, c))
        return moves

class Minimax:
    """
    Utility class to run the minimax algorithm to help not lose tic tac toe!
    """
    @staticmethod
    def findNextMove(game, player):
        """
        Uses the minimax algorithm to find the best next move
        for a given TicTacToe game for a given player.
        Returns a tuple with the row and column of the next move.

        game - a TicTacToe game in any state of play
        player - the symbol of the player that wants to find a move
        """
        # get a list of potential squares we can move
        potentialMoves = game.getAvailableMoves()
        maxScore = -1
        maxMove = None

        # run the minimax algorithm to determine if a potential move is the best move
        for row, col in potentialMoves:
            # copy the game and make the move
            currBoard = deepcopy(game)
            currBoard.move(row, col, player)
            # get the score for this move
            currScore = Minimax._minimax(currBoard, getOppositePlayer(player))
            # track the best score and move
            if currScore >= maxScore:
                maxScore = currScore
                maxMove = (row, col)

        # return the best potential move
        return maxMove

    @staticmethod
    def _minimax(game, player, computer=OH):
        """
        Runs the minimax algorithm with a given TicTacToe board,
        the symbol of a given player, and the symbol of the computer player.
        Future implementations should use alpha-beta pruning to speed things up!

        game - a TicTacToe game in any state of play
        player - the symbol of the player that wants to find a move
        computer - the symbol of the computer (the one we want to win)!
        """
        # weight the computer positively and the human player negatively
        multiplier = 1 if computer == player else -1

        # if the game is over return the score
        (isOver, winner, _) = game.isOver()
        if isOver: return Minimax._getScore(winner)
        
        # otherwise iterate through potential moves
        potentialMoves = game.getAvailableMoves()
        maxScore = -1
        for row, col in potentialMoves:
            currBoard = deepcopy(game)
            currBoard.move(row, col, player)
            # recursively call the function to find the best score
            currScore = multiplier * Minimax._minimax(currBoard, getOppositePlayer(player))
            if currScore >= maxScore:
                maxScore = currScore

        # return the score weighted appropriately
        return multiplier * maxScore

    @staticmethod
    def _getScore(winner, computer=OH):
        """
        Returns the score based on the symbol of the winner and the
        symbol of the computer, or tie.  
        """
        if winner is None or winner is TIE:
            return 0
        else:
            return 1 if winner == computer else -1
