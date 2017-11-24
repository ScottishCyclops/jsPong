(()=>{
    "use strict"
    // game functions
    /**
     * Makes the paddle data structure
     * @param {{x: number, y: number}} size size of the paddle
     * @param {number} speed speed of the paddle
     * @param {number} padding distance from the border of the page
     */
    const makePaddlesData = (size, speed, padding) =>
    ({
        halfHeight: size.y / 2,
        size,
        speed,
        padding
    });
    /**
     * Creates a new paddle on the page
     * @param {{x: number, y: number}} pos the base position of the paddle
     * @param {{x: number, y: number}} size the size of the paddle
     * @param {string} color the CSS color string of the paddle
     * @param {any} extrasStyle any extra styling to apply before the rest
     */
    const makePaddle = (pos, size, color, extrasStyle) =>
    ({
        elem: translate(addToDom(applyStyle(document.createElement("div"), extrasStyle, {
            width: px(size.x),
            height: px(size.y),
            backgroundColor: color
        })), pos),
        pos
    });
    /**
     * Creates a new ball on the page
     * @param {{x: number, y: number}} pos
     * @param {{x: number, y: number}} vel
     * @param {number} d the diameter of the ball
     * @param {string} color the CSS color string of the paddle
     * @param {any} extrasStyle any extra styling to apply before the rest
     */
    const makeBall = (pos, vel, d, color, extrasStyle) =>
    ({
        elem: translate(addToDom(applyStyle(document.createElement("div"), extrasStyle, {
            width: px(d),
            height: px(d),
            backgroundColor: color
        })), pos),
        r: d / 2,
        pos,
        vel,
        d
    });
    const makeMachinePlayer = (pad) =>
    ({
        score: 0,
        type: playerType.MACHINE,
        hitPos: 0,
        pad
    });
    const makeHumanPlayer = (pad, upKey, downKey) =>
    ({
        score: 0,
        up: false,
        down: false,
        type: playerType.HUMAN,
        pad,
        upKey,
        downKey
    });
    /**
     * Calls `callback` with the paddle that collides with the `pos2`
     *
     * Will call `callback` 0 or 1 time
     * @param {Function} callback
     * @param {{x: number, y: number}} pos2
     * @param {{x: number, y: number}} size
     * @param {any[]} paddles
     * @return {any} whatever the `callback` returns
     */
    const getCollision = (callback, pos2, size, ...paddles) =>
    {
        for(const paddle of paddles)
        {
            if(isInside(paddle.pos, size, pos2))
            {
                return callback(paddle);
            }
        }
    };

    const playerType =
    {
        MACHINE: 0,
        HUMAN: 1
    };

    /**
     * Main function
     */
    const main = () =>
    {
        // constant between games

        const width = innerWidth;
        const height = innerHeight;

        const restartTime = 500;

        // made originaly for a width of 800px
        const scaleFac = width / 800;

        // 0: beginner
        // 1: normal
        // 2: master
        const level = 1;

        // how much the ball goes crazy when hitting on the paddle sides (0-1)
        const divergenceFactor = level === 0 ? 0.3 : level === 1 ? 0.4 : 0.8;
        const speedFac = scaleFac * (level === 0 ? 0.9 : level === 1.1 ? 1 : 1.3);
        // how much the machine cannot hit on the sides of the paddle
        const hitSafeZone = level === 0 ? paddles.halfHeight - 5 : level === 1 ? 5 : 1;

        // canvas
        addToDom(applyStyle(document.createElement("div"), {
            width: px(width),
            height: px(height),
            backgroundColor: "#333",
            cursor: "none"
        }));

        const elemsColor = "#EEE";
        const baseStyle =
        {
            position: "absolute",
            left: 0,
            top: 0
        };

        const paddles = makePaddlesData(vec2(10 * scaleFac, (level === 0 ? 80 : level === 1 ? 60 : 40) * scaleFac), 0.3 * speedFac, 10 * scaleFac);

        const player1 = makeHumanPlayer(makePaddle(vec2(0, 0), paddles.size, elemsColor, baseStyle), "w", "s");
        const player2 = makeMachinePlayer(makePaddle(vec2(0, 0), paddles.size, elemsColor, baseStyle));
        const ball =    makeBall(vec2(0, 0), vec2(0, 0), 13  * scaleFac, elemsColor, baseStyle);

        document.onkeydown = e =>
        {
            branch(e.key === player1.downKey, () => player1.down = true,   () => branch(e.key === player1.upKey, () => player1.up = true))
        };
        document.onkeyup = e =>
        {
            branch(e.key === player1.downKey, () => player1.down = false,  () => branch(e.key === player1.upKey, () => player1.up = false))
        };

        // game

        // loop breaker flag
        let playing = false;
        let last = 0;
        let startTime = -1;

        const update = t =>
        {
            if(startTime === -1)
            {
                startTime = t;
            }

            const delta = t - last - startTime;
            last = t - startTime;

            // move players
            [player1, player2].forEach(player =>
            {
                branch(player.type === playerType.HUMAN, () =>
                {
                    const direction = (player.up && player.down) || (!player.up && !player.down) ? 0 : player.up ? -1 : 1;
                    player.pad.pos.y = clamp(player.pad.pos.y + direction * paddles.speed * delta, 0, height - paddles.size.y);
                    translate(player.pad.elem, player.pad.pos);
                }, () =>
                {
                    const desiredMove = ball.pos.y - player.pad.pos.y - player.hitPos;
                    const move = normalize(Math.round(desiredMove)) * paddles.speed * delta;

                    player.pad.pos.y = clamp(player.pad.pos.y + move, 0, height - paddles.size.y);
                    translate(player.pad.elem, player.pad.pos);
                });
            });


            getCollision(paddle =>
            {
                ball.vel.x *= -1;

                // choose a new hit pos for the machine
                // TODO: move logic in better place
                player2.hitPos = Math.floor(rand(hitSafeZone, paddles.size.y - hitSafeZone));

                // value between -1 and +1
                // 0 means hit at the center of the paddle
                const divergence = (paddle.pos.y + paddles.halfHeight - ball.pos.y) / paddles.halfHeight;

                ball.vel.y -= divergence * divergenceFactor;
            }, ball.pos, paddles.size, player1.pad, player2.pad);

            // detect collision with top
            if(ball.pos.y < 0)
            {
                ball.pos.y = 0;
                ball.vel.y *= -1;
            }
            // detect position with bottom
            if(ball.pos.y > height - 1)
            {
                ball.pos.y = height - 1;
                ball.vel.y *= -1;
            }

            // end of the game
            multiTestCallback(result =>
            {
                let [ won, msg ] = result;

                // increase score
                branch(won, () => player1.score++, () => player2.score++);

                msg = `${msg}\n${player1.score} - ${player2.score}`;

                playing = false;
                removeFromDom(ball.elem);
                // add message div
                const label = translate(addToDom(setProps(applyStyle(document.createElement("div"), baseStyle, {
                    fontSize: px(50 * scaleFac),
                    color: elemsColor,
                    width: px(width),
                    textAlign: "center",
                    fontFamily: "monospace"
                }), { innerText: msg })), vec2(0, 60));

                setTimeout(() =>
                {
                    removeFromDom(label);
                    addToDom(ball.elem);
                    start();
                }, restartTime);
            },
                { condition: () => ball.pos.x < 0,      value: () => [false, "YOU LOSE!"] },
                { condition: () => ball.pos.x >= width, value: () => [true, "YOU WIN!"] }
            );

            // move the ball
            ball.pos.x += ball.vel.x * delta;
            ball.pos.y += ball.vel.y * delta;
            translate(ball.elem, subScal(ball.pos, ball.r));

            if(!playing)
            {
                return;
            }

            // request next frame
            requestAnimationFrame(update);
        };

        const start = () =>
        {
            // player2.hitPos = 0;
            playing = true;
            last = 0;
            startTime = -1;
            player1.pad.pos = vec2(paddles.padding, 0);
            translate(player1.pad.elem, player1.pad.pos);
            player2.pad.pos = vec2(width - paddles.padding - paddles.size.x, 0);
            translate(player2.pad.elem, player2.pad.pos);
            ball.pos = vec2(width / 2, height / 2);
            ball.vel = multScal(vec2(-0.3, -0.2), speedFac);
            translate(ball.elem, ball.pos);

            // start the update loop
            requestAnimationFrame(update);
        };

        start();
    };

    // start the program
    main();
})();
