# Bomberman
The project we developped is a simple bomberman.
The principle of this game is quite simple:Being the last alive.
Each player has 3 lives and one bomb.The players move in a 2D world filled with dirt roads,bric walls and concrete walls.
They can travel through the dirt roads and make they way accros the map by breaking the brics wall with their bombs-the concrete walls being indestructible.
To do so, they have to drop a bomb on the floor by entering the "space" key. 3 seconds after they did it, the bomb explode in a cross-shaped form destucting all the adjacents squares.Be aware of not trapping yourzelves because you can't pass through a bomb, even if it's yours.

The goal is to explode the other players until they have no more life.

Initialy, the players have one bomb at a time so they need to wait for the bomb to expolde to place another.
However, they can increase the number of bombs they can drop at the same time. To do so, they must grab a specific bonus, increasing their number of bomb by one.
There are other types of bonus such as:

Increased range:The explision range grow by one into the four directions. It must be noted that the explosion can destruct only the first wall they encouter in each direction, in other words the explosions don't go through multiple layers of walls.

Powerful explosion:the explosion can now go through 2 layers of walls.

With that being said, let's jump right into the organisation of the site.

The menu allow the player to choose a name and to create a party.He also can join an already existing party.
The creator of the party is the host and the only one who can lauch the game after choosing the level.
Before lauchning the game, the party needs at least two players.

Once the party is finished, the host can restart the game or quit the game-without quiting the party.
On the other hand, the rest of the players can only leave the party.

