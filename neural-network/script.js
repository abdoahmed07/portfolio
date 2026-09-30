/* ════════════════════════════════════════════════════════════
   Neural Network, real trained MNIST weights, ported forward pass
   Mirrors neuralnet/layer.py + neuralnet/activations.py exactly.
   These are the ACTUAL weights from training (97.4% test accuracy),
   loaded from weights.js, not a simulation.
════════════════════════════════════════════════════════════ */

document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
        document.querySelectorAll('.tab-content').forEach(function (c) { c.classList.remove('active'); });
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
});

/* ════════════════════════════════════════════════════════════
   FORWARD PASS, mirrors Layer.forward() in neuralnet/layer.py
   Z = X @ W + b, then an activation. No training, inference only.
════════════════════════════════════════════════════════════ */
function relu(row) {
    var out = new Float64Array(row.length);
    for (var i = 0; i < row.length; i++) out[i] = Math.max(0, row[i]);
    return out;
}

function softmax(row) {
    var max = -Infinity;
    for (var i = 0; i < row.length; i++) if (row[i] > max) max = row[i];
    var exp = new Float64Array(row.length);
    var sum = 0;
    for (i = 0; i < row.length; i++) { exp[i] = Math.exp(row[i] - max); sum += exp[i]; }
    for (i = 0; i < row.length; i++) exp[i] /= sum;
    return exp;
}

/* row (1 x inSize) @ W (inSize x outSize) + b (1 x outSize) */
function denseForward(row, W, b, activation) {
    var outSize = W[0].length;
    var inSize = row.length;
    var z = new Float64Array(outSize);
    for (var j = 0; j < outSize; j++) {
        var sum = b[0][j];
        for (var i = 0; i < inSize; i++) sum += row[i] * W[i][j];
        z[j] = sum;
    }
    return activation === 'relu' ? relu(z) : softmax(z);
}

/* The exact architecture from train_mnist.py: 784 -> 256 relu -> 128 relu -> 10 softmax */
function forward(input784) {
    var a0 = denseForward(input784, NN_WEIGHTS.W0, NN_WEIGHTS.b0, 'relu');
    var a1 = denseForward(a0, NN_WEIGHTS.W1, NN_WEIGHTS.b1, 'relu');
    var a2 = denseForward(a1, NN_WEIGHTS.W2, NN_WEIGHTS.b2, 'softmax');
    return a2; // 10 probabilities
}

/* ════════════════════════════════════════════════════════════
   DRAWING CANVAS + PREPROCESSING
   Mirrors webapp/app.py's preprocess_canvas(): find the drawn
   digit's bounding box, pad it, square it, then resize to 28x28
   and normalize to [0,1], the exact shape the model expects.
════════════════════════════════════════════════════════════ */
(function () {
    var canvas = document.getElementById('drawCanvas');
    var ctx = canvas.getContext('2d');
    var SIZE = 300;
    canvas.width = SIZE; canvas.height = SIZE;

    var drawing = false;
    var hasInk = false;

    function clearCanvas() {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, SIZE, SIZE);
        hasInk = false;
    }
    clearCanvas();

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 18;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    function pos(e) {
        var rect = canvas.getBoundingClientRect();
        var clientX = e.touches ? e.touches[0].clientX : e.clientX;
        var clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: (clientX - rect.left) * (SIZE / rect.width), y: (clientY - rect.top) * (SIZE / rect.height) };
    }

    var lastPos = null;
    function startDraw(e) {
        e.preventDefault();
        drawing = true;
        lastPos = pos(e);
        ctx.beginPath();
        ctx.arc(lastPos.x, lastPos.y, ctx.lineWidth / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        hasInk = true;
    }
    function moveDraw(e) {
        if (!drawing) return;
        e.preventDefault();
        var p = pos(e);
        ctx.beginPath();
        ctx.moveTo(lastPos.x, lastPos.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        lastPos = p;
        hasInk = true;
    }
    function endDraw() {
        if (!drawing) return;   // mouseup is on window, so ignore clicks that did not start on the canvas
        drawing = false;
        predictLoop();
    }

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', moveDraw);
    window.addEventListener('mouseup', endDraw);
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', moveDraw, { passive: false });
    canvas.addEventListener('touchend', endDraw);

    document.getElementById('nnClear').addEventListener('click', function () {
        clearCanvas();
        showEmptyState();
    });

    /* Crop to the digit's bounding box, pad it, square it, resize to 28x28.
       Mirrors preprocess_canvas() in webapp/app.py. */
    function preprocess() {
        var img = ctx.getImageData(0, 0, SIZE, SIZE);
        var data = img.data;
        var threshold = 30;

        var minX = SIZE, maxX = -1, minY = SIZE, maxY = -1;
        for (var y = 0; y < SIZE; y++) {
            for (var x = 0; x < SIZE; x++) {
                var idx = (y * SIZE + x) * 4;
                var v = data[idx]; // strokes are pure white on black, R channel is enough
                if (v > threshold) {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }
        }
        if (maxX < 0) return null; // nothing drawn

        var h = maxY - minY, w = maxX - minX;
        var pad = Math.max(Math.floor(Math.max(h, w) * 0.2), 4);
        minX = Math.max(minX - pad, 0); maxX = Math.min(maxX + pad, SIZE - 1);
        minY = Math.max(minY - pad, 0); maxY = Math.min(maxY + pad, SIZE - 1);

        var cropW = maxX - minX + 1, cropH = maxY - minY + 1;
        var side = Math.max(cropW, cropH);

        // Draw the cropped region centered onto a square canvas, then downscale to 28x28
        var squareCanvas = document.createElement('canvas');
        squareCanvas.width = side; squareCanvas.height = side;
        var sctx = squareCanvas.getContext('2d');
        sctx.fillStyle = '#000';
        sctx.fillRect(0, 0, side, side);
        sctx.drawImage(canvas, minX, minY, cropW, cropH,
            Math.floor((side - cropW) / 2), Math.floor((side - cropH) / 2), cropW, cropH);

        var small = document.createElement('canvas');
        small.width = 28; small.height = 28;
        var smctx = small.getContext('2d');
        smctx.imageSmoothingEnabled = true;
        smctx.imageSmoothingQuality = 'high';
        smctx.drawImage(squareCanvas, 0, 0, 28, 28);

        var smallData = smctx.getImageData(0, 0, 28, 28).data;
        var input = new Float64Array(784);
        for (var i = 0; i < 784; i++) input[i] = smallData[i * 4] / 255.0; // grayscale, normalized
        return input;
    }

    function showEmptyState() {
        document.getElementById('predNum').textContent = '–';
        document.getElementById('predConf').innerHTML = 'Draw a digit, 0 through 9, on the canvas.';
        renderBars(null);
    }

    function renderBars(probs) {
        var bars = document.getElementById('probBars');
        bars.innerHTML = '';
        var top = probs ? probs.indexOf(Math.max.apply(null, probs)) : -1;
        for (var d = 0; d < 10; d++) {
            var p = probs ? probs[d] : 0;
            var pct = (p * 100).toFixed(1);
            var row = document.createElement('div');
            row.className = 'prob-row';
            row.innerHTML =
                '<span class="prob-label' + (d === top ? ' top' : '') + '">' + d + '</span>' +
                '<span class="prob-track"><span class="prob-fill' + (d === top ? ' top' : '') + '" style="width:' + pct + '%"></span></span>' +
                '<span class="prob-pct">' + pct + '%</span>';
            bars.appendChild(row);
        }
    }

    function predictLoop() {
        if (!hasInk) { showEmptyState(); return; }
        var input = preprocess();
        if (!input) { showEmptyState(); return; }

        var probs = forward(input);
        var probsArr = Array.prototype.slice.call(probs);
        var digit = probsArr.indexOf(Math.max.apply(null, probsArr));
        var confidence = (probsArr[digit] * 100).toFixed(1);

        document.getElementById('predNum').textContent = digit;
        document.getElementById('predConf').innerHTML = '<b>' + confidence + '%</b> confidence';
        renderBars(probsArr);
    }

    showEmptyState();
})();

/* ════════════════════════════════════════════════════════════
   CODE VIEWER, actual Python source
════════════════════════════════════════════════════════════ */
(function () {
    var SRC = {};

    SRC.layer = String.raw`class Layer:
    def __init__(self, input_size, output_size, activation="relu"):
        # He initialization for ReLU layers, keeps gradient magnitudes
        # stable during early training
        if activation == "relu":
            self.W = np.random.randn(input_size, output_size) * np.sqrt(2.0 / input_size)
        else:
            self.W = np.random.randn(input_size, output_size) * np.sqrt(1.0 / input_size)
        self.b = np.zeros((1, output_size))

    def forward(self, X: np.ndarray) -> np.ndarray:
        """Z = X @ W + b, A = activation(Z)"""
        self._cache_X = X
        Z = X @ self.W + self.b
        self._cache_Z = Z

        if self.activation == "relu":
            return relu(Z)
        elif self.activation == "softmax":
            return softmax(Z)

    def backward(self, dA: np.ndarray) -> np.ndarray:
        """
        Chain rule:
            dZ = dA * activation'(Z)
            dW = X.T @ dZ / batch_size
            db = sum(dZ) / batch_size
            dX = dZ @ W.T   (passed to the previous layer)
        """
        batch_size = self._cache_X.shape[0]
        dZ = dA * relu_derivative(self._cache_Z) if self.activation == "relu" else dA

        self.dW = self._cache_X.T @ dZ / batch_size
        self.db = np.sum(dZ, axis=0, keepdims=True) / batch_size
        return dZ @ self.W.T`;

    SRC.activations = String.raw`def relu(z):
    """max(0, z). Simple and effective for hidden layers."""
    return np.maximum(0, z)


def softmax(z):
    """Converts raw scores to a probability distribution that sums to 1.
    Subtracting the max before exponentiating prevents numerical overflow,
    the math works out the same but avoids inf values."""
    shifted = z - np.max(z, axis=1, keepdims=True)
    exp_z = np.exp(shifted)
    return exp_z / np.sum(exp_z, axis=1, keepdims=True)

# I don't implement a standalone softmax_derivative, in practice it's always
# combined with cross-entropy loss, and that combined gradient simplifies to
# (predictions - true_labels) / batch_size. See loss.py.`;

    SRC.loss = String.raw`def cross_entropy_loss(predictions, labels):
    """-sum(labels * log(predictions)) / batch_size"""
    eps = 1e-15
    predictions = np.clip(predictions, eps, 1 - eps)  # avoid log(0)
    return float(-np.sum(labels * np.log(predictions)) / predictions.shape[0])


def cross_entropy_gradient(predictions, labels):
    """
    Gradient of cross-entropy(softmax(z)) with respect to z simplifies to:
        dL/dz = predictions - labels

    Derivation:
      dL/d(softmax_k)   = -labels_k / predictions_k
      d(softmax_k)/d(z_j) = softmax_k * (delta_kj - softmax_j)
      Combining and summing over k: dL/dz_j = predictions_j - labels_j

    This is why softmax + cross-entropy is so common: the gradient is this clean.
    """
    return (predictions - labels) / predictions.shape[0]`;

    SRC.preprocess = String.raw`def preprocess_canvas(image_data_base64: str) -> np.ndarray:
    """
    Convert a base64-encoded PNG canvas image to what the model expects:
    28x28, grayscale, normalized to [0,1], flattened to (1, 784).
    The canvas draws white strokes on a black background (MNIST convention).
    """
    image_data = base64.b64decode(image_data_base64.split(",")[1])
    image = Image.open(io.BytesIO(image_data)).convert("L")
    arr = np.array(image, dtype=float)

    # Crop tightly around the drawn digit
    threshold = 30
    rows = np.any(arr > threshold, axis=1)
    cols = np.any(arr > threshold, axis=0)

    if rows.any() and cols.any():
        rmin, rmax = np.where(rows)[0][[0, -1]]
        cmin, cmax = np.where(cols)[0][[0, -1]]

        # Pad by 20% of the digit's size, then make the crop square
        h, w = rmax - rmin, cmax - cmin
        pad = max(int(max(h, w) * 0.2), 4)
        rmin, rmax = max(rmin - pad, 0), min(rmax + pad, arr.shape[0] - 1)
        cmin, cmax = max(cmin - pad, 0), min(cmax + pad, arr.shape[1] - 1)
        arr = arr[rmin:rmax+1, cmin:cmax+1]

        h, w = arr.shape
        if h != w:
            size = max(h, w)
            square = np.zeros((size, size), dtype=float)
            square[(size-h)//2:(size-h)//2+h, (size-w)//2:(size-w)//2+w] = arr
            arr = square

    image = Image.fromarray(arr.astype(np.uint8)).resize((28, 28), Image.LANCZOS)
    return (np.array(image, dtype=float) / 255.0).flatten().reshape(1, 784)`;

    var codeBlock = document.getElementById('codeBlock');
    function loadCode(key) {
        codeBlock.textContent = SRC[key];
        codeBlock.removeAttribute('data-highlighted');
        hljs.highlightElement(codeBlock);
    }
    document.querySelectorAll('.file-tab').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.file-tab').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            loadCode(btn.dataset.file);
        });
    });
    loadCode('layer');
})();
