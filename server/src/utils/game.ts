export class Game {
	static instance: Game;
	playerO: string | undefined;
	playerX: string | undefined;
	squares: string[] = Array(9).fill('');
	moves: number = 0;

	static getInstance() {
		if (!this.instance) {
			this.instance = new Game();
		}
		return this.instance;
	}

	setPlayerO(player: string) {
		this.playerO = player;
	}

	setPlayerX(player: string) {
		this.playerX = player;
	}

	setSquares(squares: string[]) {
		this.squares = squares;
	}

	playersJoined() {
		let counter = 0;
		if (this.playerO) {
			counter++;
		}
		if (this.playerX) {
			counter++;
		}
		return counter;
	}

	resetGame() {
		this.playerO = undefined;
		this.playerX = undefined;
		this.squares = [];
		this.moves = 0;
	}

	xIsNext() {
		return this.moves % 2 === 0;
	}

	playerMove(i: number) {
		if (this.calculateWinner(this.squares) || this.squares[i]) {
			return;
		}
		const nextSquares = this.squares.slice();
		if (this.xIsNext()) {
			nextSquares[i] = 'X';
		} else {
			nextSquares[i] = 'O';
		}
		this.setSquares(nextSquares);
		this.moves++;
	}

	authPlayer(playerId: string) {
		return playerId === this.playerO || playerId === this.playerX;
	}

	calculateWinner(squares: string[]) {
		const lines = [
			[0, 1, 2],
			[3, 4, 5],
			[6, 7, 8],
			[0, 3, 6],
			[1, 4, 7],
			[2, 5, 8],
			[0, 4, 8],
			[2, 4, 6]
		];
		for (let i = 0; i < lines.length; i++) {
			const [a, b, c] = lines[i];
			if (
				squares[a] &&
				squares[a] === squares[b] &&
				squares[a] === squares[c]
			) {
				return squares[a];
			}
		}
		return null;
	}
}
