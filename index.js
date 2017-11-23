(()=>{
    "use strict"

    const rand = (min, max) => Math.random() * (max - min) + min;

    const setProps = (elem, ...properties) =>
    {
        for(const props of properties)
        {
            Object.assign(elem, props);
        }
        return elem;
    };

    const applyStyle = (elem, ...styles) =>
    {
        setProps(elem.style, ...styles);
        return elem;
    }

    const addToDom = elem =>
    {
        document.body.appendChild(elem);
        return elem;
    };

    const removeFromDom = elem =>
    {
        document.body.removeChild(elem);
        return elem;
    };

    const px = value => value.toString() + "px";

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const normalize = value => value < 0 ? -1 : value > 0 ? 1 : 0;

    const translate = (elem, pos) => applyStyle(elem, { transform: `translate(${px(pos.x)}, ${px(pos.y)})` });

    const baseStyle =
    {
        position: "absolute",
        left: 0,
        top: 0
    };

    const vec2 = (x, y) =>
    {
        return {
            x,
            y
        };
    };

    const subScal = (vec, scalar) => vec2(vec.x - scalar, vec.y - scalar);
    const multScal = (vec, scalar) => vec2(vec.x * scalar, vec.y * scalar);

    const makePaddlesData = (size, speed, padding) =>
    {
        return {
            halfHeight: size.y / 2,
            size,
            speed,
            padding
        };
    };

    const makePaddle = (pos, size, color) =>
    {
        return {
            elem: translate(addToDom(applyStyle(document.createElement("div"), baseStyle, {
                width: px(size.x),
                height: px(size.y),
                backgroundColor: color,
            })), pos),
            pos
        };
    };

    const makeBall = (pos, vel, d, color) =>
    {
        return {
            elem: translate(addToDom(applyStyle(document.createElement("div"), baseStyle, {
                width: px(d),
                height: px(d),
                backgroundColor: color,
            })), pos),
            r: d / 2,
            pos,
            vel,
            d
        };
    };

    const collision = (pos, size, pos2) =>
    {
        return pos2.x >= pos.x &&
            pos2.x <= pos.x + size.x &&
            pos2.y >= pos.y &&
            pos2.y <= pos.y + size.y
    };

    const getCollision = (callback, pos2, size, ...paddles) =>
    {
        for(const paddle of paddles)
        {
            if(collision(paddle.pos, size, pos2))
            {
                return callback(paddle);
            }
        }
    };

    // main
    (()=>{
        const width = innerWidth;
        const height = innerHeight;

        // made originaly for a width of 800px
        const scaleFac = width / 800;

        // 0: beginner
        // 1: novice
        // 2: master
        const level = 1;

        // how much the ball goes crazy when hitting on the paddle sides (0-1)
        const divergenceFactor = level === 0 ? 0.3 : level === 1 ? 0.4 : 0.8;

        let up = false;
        let down = false;
        let playing = true;

        const canvas = addToDom(applyStyle(document.createElement("div"), {
            width: px(width),
            height: px(height),
            backgroundColor: "#333",
            cursor: "none"
        }));

        const elemsColor = "#EEE";

        const speedFac = scaleFac * (level === 0 ? 0.9 : level === 1.1 ? 1 : 1.3);
        const paddles = makePaddlesData(vec2(10 * scaleFac, (level === 0 ? 80 : level === 1 ? 60 : 40) * scaleFac), 0.3 * speedFac, 10 * scaleFac);

        const player1 = makePaddle(vec2(paddles.padding,                         0), paddles.size, elemsColor);
        const player2 = makePaddle(vec2(width - paddles.padding - paddles.size.x, 0), paddles.size, elemsColor);

        const ball = makeBall(vec2(width / 2,  height / 2), multScal(vec2(-0.3, -0.2), speedFac), 13  * scaleFac, elemsColor);


        let hitPos = 1;
        const hitSafeZone = level === 0 ? paddles.halfHeight - 5 : level === 1 ? 5 : 1;

        document.onkeydown = e =>
        {
            if(e.key === "s")
            {
                down = true;
            }
            else if(e.key === "w")
            {
                up = true;
            }
        };

        document.onkeyup = e =>
        {
            if(e.key === "s")
            {
                down = false;
            }
            else if(e.key === "w")
            {
                up = false;
            }
        };

        const restart = () =>
        {
            ball.pos.x = width / 2;
            ball.pos.y = height / 2;
            translate(ball.elem, ball.pos);

            playing = true;
            update(0);
        };

        const end = msg =>
        {
            removeFromDom(ball.elem);
            // add message div
            translate(addToDom(setProps(applyStyle(document.createElement("div"), baseStyle, {
                fontSize: px(50 * scaleFac),
                color: elemsColor,
                width: px(width),
                textAlign: "center",
                fontFamily: "monospace"
            }), { innerText: msg })), vec2(0, 60));

            setTimeout(() => restart(), 1000);
        }

        let last = 0;
        const update = t =>
        {
            const delta = t - last;
            last = t;

            // move player 1
            const direction = (up && down) || (!up && !down) ? 0 : up ? -1 : 1;
            player1.pos.y = clamp(player1.pos.y + direction * paddles.speed * delta, -paddles.halfHeight, height - paddles.halfHeight);
            translate(player1.elem, player1.pos);

            getCollision(paddle =>
            {
                ball.vel.x *= -1;

                // choose a new hit pos for the machine
                hitPos = Math.round(rand(hitSafeZone, paddles.size.y - hitSafeZone));

                // value between -1 and +1
                // 0 means hit at the center of the paddle
                const divergence = (paddle.pos.y + paddles.halfHeight - ball.pos.y) / paddles.halfHeight;

                ball.vel.y -= divergence * divergenceFactor;
            }, ball.pos, paddles.size, player1, player2);

            // detect collision with top and bottom
            if(ball.pos.y < 0)
            {
                ball.pos.y = 0;
                ball.vel.y *= -1;
            }

            if(ball.pos.y > height)
            {
                ball.pos.y = height;
                ball.vel.y *= -1;
            }

            // detect end of the game
            if(ball.pos.x <= 0)
            {
                end("YOU LOOSE!");
                playing = false;
            }

            if(ball.pos.x >= width)
            {
                end("YOU WIN!");
                playing = false;
            }

            // move player 2
            // desired position (center of paddle for now)
            // calc random target position on the paddle
            const desiredMove = ball.pos.y - player2.pos.y - hitPos;
            const move = normalize(Math.round(desiredMove)) * paddles.speed * delta;

            player2.pos.y = clamp(player2.pos.y + move, -paddles.halfHeight, height - paddles.halfHeight);
            translate(player2.elem, player2.pos);

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

        // start the update loop
        update(0);
    })();
})();
