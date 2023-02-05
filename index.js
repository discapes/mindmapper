const COLORS = {
	line: "white",
	drag: "#38BDF8",
	select: "#7DD3FC",
	control: "#F0F9FF",
};

const map = [];
const deleted = [];
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
let ctrlKey = false;
let altKey = false;
let held = null;
let selected = null;

//

(() => {
	const w = canvas.clientWidth;
	const h = canvas.clientHeight;
	canvas.height = h;
	canvas.width = w;
	map.push({
		x: w / 2,
		y: h / 2,
		text: "Hello world",
		children: [

		],
	});
	map[0].children.push({
		x: w / 2 + 100,
		y: h / 2 + 100,
		text: "Hello world 2",
		parent: map[0],
		children: [
		],
	});
	map[0].children[0].children.push({
		x: w / 2 + 200,
		y: h / 2 - 100,
		text: "Hello world 3",
		parent: map[0].children[0],
		children: [
		],
	});
	drawMap();
})();

//

document.addEventListener("keydown", (e) => {
	if (e.key === "Control") {
		ctrlKey = true;
	}
	if (e.key === "Alt") {
		altKey = true;
	}
	if (selected) {
		if (e.key === "Backspace") {
			selected.text = selected.text.slice(0, -1);
		} else if (e.key === "Escape") {
			selected = undefined;
		} else if (e.key === "Delete") {
			deleted.push(
				selected.parent.children.splice(
					selected.parent.children.indexOf(selected),
					1
				)[0]
			);
		} else if (e.key === "Enter" && e.shiftKey) {
			selected.children.push({
				x: selected.x + 30,
				y: selected.y + 30,
				text: "",
				parent: selected,
				children: [],
			});
			selected = selected.children.at(-1);
		} else if (ctrlKey && e.key === "z") {
			const n = deleted.pop();
			if (n) n.parent.children.push(n);
		} else if (e.key.length === 1) {
			selected.text += e.key;
		}
	} else if (altKey && e.key === "s") {
		zoomOut();
	} else if (altKey && e.key === "g") {
		zoomIn();
	}
	drawMap();
});

document.addEventListener("keyup", (e) => {
	if (e.key === "Control") {
		ctrlKey = false;
	} else if (e.key === "Alt") {
		altKey = false;
	}
});

document.addEventListener("mouseup", (e) => {
	held = undefined;
	drawMap();
});

document.addEventListener("mousedown", (e) => {
	const { x: mx, y: my } = getMousePos(canvas, e);
	for (const node of map) {
		held = findNested(node, (node) =>
			inRectangle(mx, my, node.r.x, node.r.y, node.r.w, node.r.h)
		);
		selected = held;
	}
	drawMap();
});

document.addEventListener("mousemove", (e) => {
	if (held) {
		if (ctrlKey) {
			forEachNested(held, (n) => {
				n.x += e.movementX;
				n.y += e.movementY;
			});
		} else {
			held.x += e.movementX;
			held.y += e.movementY;
		}
		drawMap();
	}
});

//

function findNested(node, f) {
	if (f(node)) return node;
	if (node.children) {
		for (const c of node.children) {
			const res = findNested(c, f);
			if (res) return res;
		}
	}
}

function getMousePos(canvas, evt) {
	var rect = canvas.getBoundingClientRect();
	return {
		x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
		y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
	};
}

function forEachNested(node, f) {
	f(node);
	node.children?.forEach((c) => forEachNested(c, f));
}

const inRectangle = (mx, my, rx, ry, rw, rh) =>
	mx >= rx && my >= ry && mx <= rx + rw && my <= ry + rh;

function drawNode(node) {
	const padding = { x: 5, y: 5 };

	node.children?.forEach?.((c) => {
		ctx.beginPath();
		ctx.moveTo(node.x, node.y);
		ctx.lineTo(c.x, c.y);
		ctx.strokeStyle = COLORS.line;
		ctx.stroke();
		drawNode(c);
	});

	ctx.fillStyle = node === selected ? COLORS.select : "white";

	let cur = node;
	do {
		if (cur === held) {
			ctx.fillStyle = COLORS.drag;
			break;
		}
		cur = cur.parent;
	} while (ctrlKey && cur);

	const measures = node.text
		? ctx.measureText(node.text)
		: ctx.measureText("XXXXX");
	node.r = {
		x: node.x - measures.actualBoundingBoxLeft - padding.x,
		y: node.y - measures.actualBoundingBoxAscent - padding.y,
		w:
			Math.max(
				measures.actualBoundingBoxLeft + measures.actualBoundingBoxRight,
				measures.width
			) +
			2 * padding.x,
		h:
			measures.actualBoundingBoxAscent +
			measures.actualBoundingBoxDescent +
			2 * padding.y,
	};
	ctx.fillRect(node.r.x, node.r.y, node.r.w, node.r.h);

	ctx.fillStyle = "black";
	ctx.fillText(node.text, node.x, node.y);
}

function drawMap() {
	ctx.font = "normal 20px sans-serif";
	ctx.fillStyle = COLORS.control;

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	ctx.textAlign = "left";
	const text = [
		"Drag to move nodes, type to edit them.",
		"",
		"Move with children:  -  CTRL",
		"Remove node:  -  DELETE",
		"Undo removal:  -  CTRL + Z",
		"Create children:  -  SHIFT + ENTER",
		"Shrink:  -  ALT + S",
		"Grow:  -  ALT + G",
	]
	text.forEach((t, i) => ctx.fillText(t, 0, i * 25 + 20))

	ctx.textAlign = "center";
	for (const node of map) {
		drawNode(node);
	}
}

function zoomIn() {
	canvas.height /= 11 / 10;
	canvas.width /= 11 / 10;
}

function zoomOut() {
	canvas.height *= 11 / 10;
	canvas.width *= 11 / 10;

}