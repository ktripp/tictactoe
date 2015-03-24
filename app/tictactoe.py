#!/usr/bin/env python

from copy import deepcopy

# constants
EX = "ex"
OH = "oh"
TIE = "tie"

def getOppositePlayer(player):
    return OH if player == EX else EX

class TicTacToe:
    def __init__(self, human):
        assert human == EX or human == OH
        self.board = [[None, None, None],
                      [None, None, None],
                      [None, None, None]]
        self.lastMove = None
        self.human = human
        self.computer = getOppositePlayer(human)

    def __str__(self):
        return "\n".join("".join([self._formatItem(item) for item in row])
            for row in self.board)

    def _formatItem(self, item):
        return '{:^3}'.format(item) if item is not None else " - "

    def move(self, row, col, player=None):
        if player is None: player = self.human
        assert row >= 0 and row < 3
        assert col >= 0 and col < 3
        self.board[row][col] = player
        self.lastMove = (row, col, player)

    def respondToMove(self, player=None):
        if player is None: player = self.computer
        loc = findNextMove(self, player)
        if loc is None:
            return None
        row, col = loc
        self.move(row, col, player)
        return row, col

    def checkLine(self, line):
        return None not in line and len(set(line)) == 1

    def isInDiagonal(self, row, col):
        return row == col or row + col == 2

    def checkDiagonals(self):
        left = [(0, 0), (1, 1), (2, 2)]
        right = [(0, 2), (1, 1), (2, 0)]
        if self.checkLine([self.board[r][c] for r, c in left]): return left
        if self.checkLine([self.board[r][c] for r, c in right]): return right
        return None
 
    def isOver(self):
        if self.lastMove is None: return False, None, None

        (r, c, winner) = self.lastMove
        # check row
        row = self.board[r]
        if self.checkLine(row):
            return True, winner, [(r, i) for i in range(len(row))]

        # check col
        col = zip(*self.board)[c]
        if self.checkLine(col):
            return True, winner, [(i, c) for i in range(len(col))]

        # check diagonals
        if self.isInDiagonal(r, c):
            diag = self.checkDiagonals()
            if diag is not None:
                return True, winner, diag

        # check for tie
        if None not in [col for row in self.board for col in row]:
            return True, TIE, None
        
        # if we haven't won or tied we aren't done
        return False, None, None

    def getGameState(self):
        (isOver, winner, line) = self.isOver()
        return {"gameOver": isOver,
                "winner": winner,
                "winLine": line}

    def getAvailableMoves(self):
        moves = []
        for r in range(len(self.board)):
            row = self.board[r]
            for c in range(len(row)):
                if row[c] is None:
                    moves.append((r, c))
        return moves


def findNextMove(board, player):
    potentialMoves = board.getAvailableMoves()
    maxScore = -1
    maxMove = None

    for row, col in potentialMoves:
        currBoard = deepcopy(board)
        currBoard.move(row, col, player)
        currScore = minimax(currBoard, getOppositePlayer(player))
        if currScore >= maxScore:
            maxScore = currScore
            maxMove = (row, col)

    return maxMove


def minimax(board, player, computer=OH):
    multiplier = 1 if computer == player else -1

    (isOver, winner, _) = board.isOver()
    if isOver: return getScore(winner)
    
    potentialMoves = board.getAvailableMoves()
    maxScore = -1
    for row, col in potentialMoves:
        currBoard = deepcopy(board)
        currBoard.move(row, col, player)
        currScore = multiplier * minimax(currBoard, getOppositePlayer(player))
        if currScore >= maxScore:
            maxScore = currScore

    return multiplier * maxScore


def getScore(winner, computer=OH):
    if winner is None or winner is TIE:
        return 0
    else:
        return 1 if winner == computer else -1



# t = TicTacToe(EX)
# t.move(0, 0, EX)
# print t
# print t.getGameState()
# print "\n"

# t.respondToMove(OH)
# print t
# print t.getGameState()
# print "\n"

# row, col = findNextMove(t, OH)
# t.move(row, col, OH)
# print t
# print t.getGameState()
# print "\n"

# t.move(1, 0, EX)
# print t
# print t.getGameState()
# print "\n"

# row, col = findNextMove(t, OH)
# t.move(row, col, OH)
# print t
# print t.getGameState()
# print "\n"

# t.move(2, 1, EX)
# print t
# print t.getGameState()
# print "\n"

# row, col = findNextMove(t, OH)
# t.move(row, col, OH)
# print t
# print t.getGameState()
# print "\n"