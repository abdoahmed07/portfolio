/* ════════════════════════════════════════════════════════════
   Lox Interpreter, JS port of the Java tree-walking interpreter
   Mirrors lox-java/src/com/lox/*.java: Scanner → Parser → Interpreter.
   Runs entirely client-side, no server round trip.

   One simplification from the Java version: the book's Resolver pass
   (which pre-computes variable scope distances as a perf/correctness
   optimization) is skipped here. Variables are looked up by walking the
   Environment chain dynamically instead. Behaviorally identical for
   every program in this demo, including closures and inheritance.
════════════════════════════════════════════════════════════ */

/* ── Theme toggle & tabs ──────────────────────────────────── */
(function () {
    var toggle = document.getElementById('themeToggle');
    if (!toggle) return;
    toggle.addEventListener('click', function () {
        var next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    });
})();
document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
        document.querySelectorAll('.tab-content').forEach(function (c) { c.classList.remove('active'); });
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
});

/* ════════════════════════════════════════════════════════════
   TOKEN TYPES, mirrors TokenType.java
════════════════════════════════════════════════════════════ */
var TT = {
    LEFT_PAREN: 'LEFT_PAREN', RIGHT_PAREN: 'RIGHT_PAREN', LEFT_BRACE: 'LEFT_BRACE', RIGHT_BRACE: 'RIGHT_BRACE',
    COMMA: 'COMMA', DOT: 'DOT', MINUS: 'MINUS', PLUS: 'PLUS', SEMICOLON: 'SEMICOLON', SLASH: 'SLASH', STAR: 'STAR',
    BANG: 'BANG', BANG_EQUAL: 'BANG_EQUAL', EQUAL: 'EQUAL', EQUAL_EQUAL: 'EQUAL_EQUAL',
    GREATER: 'GREATER', GREATER_EQUAL: 'GREATER_EQUAL', LESS: 'LESS', LESS_EQUAL: 'LESS_EQUAL',
    IDENTIFIER: 'IDENTIFIER', STRING: 'STRING', NUMBER: 'NUMBER',
    AND: 'AND', CLASS: 'CLASS', ELSE: 'ELSE', FALSE: 'FALSE', FUN: 'FUN', FOR: 'FOR', IF: 'IF', NIL: 'NIL', OR: 'OR',
    PRINT: 'PRINT', RETURN: 'RETURN', SUPER: 'SUPER', THIS: 'THIS', TRUE: 'TRUE', VAR: 'VAR', WHILE: 'WHILE',
    EOF: 'EOF',
};
var KEYWORDS = {
    and: TT.AND, class: TT.CLASS, else: TT.ELSE, false: TT.FALSE, for: TT.FOR, fun: TT.FUN,
    if: TT.IF, nil: TT.NIL, or: TT.OR, print: TT.PRINT, return: TT.RETURN, super: TT.SUPER,
    this: TT.THIS, true: TT.TRUE, var: TT.VAR, while: TT.WHILE,
};

function Token(type, lexeme, literal, line) {
    this.type = type; this.lexeme = lexeme; this.literal = literal; this.line = line;
}

/* Errors reported back to the caller, collected instead of thrown to stderr */
var loxErrors = [];
function reportError(line, message) { loxErrors.push({ line: line, message: message }); }
function LoxRuntimeError(token, message) {
    this.token = token; this.message = message; this.isLoxRuntimeError = true;
}
function LoxParseError() { this.isLoxParseError = true; }

/* ════════════════════════════════════════════════════════════
   SCANNER, source text → tokens. Mirrors Scanner.java, including
   the custom f"..." string-interpolation extension.
════════════════════════════════════════════════════════════ */
function Scanner(source) {
    this.source = source;
    this.tokens = [];
    this.start = 0; this.current = 0; this.line = 1;
}
Scanner.prototype.isAtEnd = function () { return this.current >= this.source.length; };
Scanner.prototype.advance = function () { return this.source[this.current++]; };
Scanner.prototype.peek = function () { return this.isAtEnd() ? '\0' : this.source[this.current]; };
Scanner.prototype.peekNext = function () {
    return this.current + 1 >= this.source.length ? '\0' : this.source[this.current + 1];
};
Scanner.prototype.match = function (expected) {
    if (this.isAtEnd() || this.source[this.current] !== expected) return false;
    this.current++; return true;
};
Scanner.prototype.isDigit = function (c) { return c >= '0' && c <= '9'; };
Scanner.prototype.isAlpha = function (c) { return /[a-zA-Z_]/.test(c); };
Scanner.prototype.isAlphaNumeric = function (c) { return this.isAlpha(c) || this.isDigit(c); };

Scanner.prototype.addToken = function (type, literal) {
    var text = this.source.substring(this.start, this.current);
    this.tokens.push(new Token(type, text, literal === undefined ? null : literal, this.line));
};

Scanner.prototype.scanTokens = function () {
    while (!this.isAtEnd()) { this.start = this.current; this.scanToken(); }
    this.tokens.push(new Token(TT.EOF, '', null, this.line));
    return this.tokens;
};

Scanner.prototype.scanToken = function () {
    var c = this.advance();
    switch (c) {
        case '(': this.addToken(TT.LEFT_PAREN); break;
        case ')': this.addToken(TT.RIGHT_PAREN); break;
        case '{': this.addToken(TT.LEFT_BRACE); break;
        case '}': this.addToken(TT.RIGHT_BRACE); break;
        case ',': this.addToken(TT.COMMA); break;
        case '.': this.addToken(TT.DOT); break;
        case '-': this.addToken(TT.MINUS); break;
        case '+': this.addToken(TT.PLUS); break;
        case ';': this.addToken(TT.SEMICOLON); break;
        case '*': this.addToken(TT.STAR); break;
        case '!': this.addToken(this.match('=') ? TT.BANG_EQUAL : TT.BANG); break;
        case '=': this.addToken(this.match('=') ? TT.EQUAL_EQUAL : TT.EQUAL); break;
        case '<': this.addToken(this.match('=') ? TT.LESS_EQUAL : TT.LESS); break;
        case '>': this.addToken(this.match('=') ? TT.GREATER_EQUAL : TT.GREATER); break;
        case '/':
            if (this.match('/')) { while (this.peek() !== '\n' && !this.isAtEnd()) this.advance(); }
            else this.addToken(TT.SLASH);
            break;
        case ' ': case '\r': case '\t': break;
        case '\n': this.line++; break;
        case '"': this.string(); break;
        default:
            if (this.isDigit(c)) this.number();
            else if (this.isAlpha(c)) this.identifier();
            else reportError(this.line, 'Unexpected character.');
    }
};

Scanner.prototype.string = function () {
    while (this.peek() !== '"' && !this.isAtEnd()) {
        if (this.peek() === '\n') this.line++;
        this.advance();
    }
    if (this.isAtEnd()) { reportError(this.line, 'Unterminated string.'); return; }
    this.advance();
    var value = this.source.substring(this.start + 1, this.current - 1);
    this.addToken(TT.STRING, value);
};

Scanner.prototype.number = function () {
    while (this.isDigit(this.peek())) this.advance();
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
        this.advance();
        while (this.isDigit(this.peek())) this.advance();
    }
    this.addToken(TT.NUMBER, parseFloat(this.source.substring(this.start, this.current)));
};

Scanner.prototype.identifier = function () {
    while (this.isAlphaNumeric(this.peek())) this.advance();
    var text = this.source.substring(this.start, this.current);

    // f"...", string interpolation extension (not in the original Lox spec)
    if (text === 'f' && this.peek() === '"') {
        this.advance();
        this.fstring();
        return;
    }
    this.addToken(KEYWORDS[text] || TT.IDENTIFIER);
};

/* f"{greeting}, {name}!" → ( "" + (greeting) + ", " + (name) + "!" ) */
Scanner.prototype.fstring = function () {
    var segments = [];
    var literal = '';

    while (!this.isAtEnd() && this.peek() !== '"') {
        if (this.peek() === '{') {
            if (literal.length > 0) { segments.push(literal); literal = ''; }
            this.advance();

            var depth = 1;
            var exprStart = this.current;
            while (!this.isAtEnd() && depth > 0) {
                var ch = this.advance();
                if (ch === '{') depth++;
                else if (ch === '}') depth--;
            }
            var exprSource = this.source.substring(exprStart, this.current - 1);

            var inner = new Scanner(exprSource);
            var exprTokens = inner.scanTokens();
            exprTokens.pop(); // drop inner EOF
            segments.push(exprTokens);
        } else {
            if (this.peek() === '\n') this.line++;
            literal += this.advance();
        }
    }
    if (this.isAtEnd()) { reportError(this.line, 'Unterminated f-string.'); return; }
    this.advance();
    if (literal.length > 0) segments.push(literal);

    if (segments.length === 0) {
        this.tokens.push(new Token(TT.STRING, '""', '', this.line));
        return;
    }

    /* Start with "" when the f-string opens with an expression, so f"{a}{b}"
       builds a string even when a and b are numbers. Otherwise it would
       parse as (a) + (b) and add them. */
    if (typeof segments[0] !== 'string') segments.unshift('');

    this.tokens.push(new Token(TT.LEFT_PAREN, '(', null, this.line));
    for (var i = 0; i < segments.length; i++) {
        var seg = segments[i];
        if (typeof seg === 'string') {
            this.tokens.push(new Token(TT.STRING, '"' + seg + '"', seg, this.line));
        } else {
            this.tokens.push(new Token(TT.LEFT_PAREN, '(', null, this.line));
            for (var j = 0; j < seg.length; j++) this.tokens.push(seg[j]);
            this.tokens.push(new Token(TT.RIGHT_PAREN, ')', null, this.line));
        }
        if (i < segments.length - 1) this.tokens.push(new Token(TT.PLUS, '+', null, this.line));
    }
    this.tokens.push(new Token(TT.RIGHT_PAREN, ')', null, this.line));
};

/* ════════════════════════════════════════════════════════════
   PARSER, recursive descent, tokens → AST.
   Expr/Stmt nodes are plain objects tagged with `kind`.
   Mirrors Parser.java exactly, one method per grammar rule.
════════════════════════════════════════════════════════════ */
function Parser(tokens) { this.tokens = tokens; this.current = 0; }

Parser.prototype.peek = function () { return this.tokens[this.current]; };
Parser.prototype.previous = function () { return this.tokens[this.current - 1]; };
Parser.prototype.isAtEnd = function () { return this.peek().type === TT.EOF; };
Parser.prototype.check = function (type) { return !this.isAtEnd() && this.peek().type === type; };
Parser.prototype.advance = function () { if (!this.isAtEnd()) this.current++; return this.previous(); };
Parser.prototype.match = function () {
    for (var i = 0; i < arguments.length; i++) {
        if (this.check(arguments[i])) { this.advance(); return true; }
    }
    return false;
};
Parser.prototype.consume = function (type, message) {
    if (this.check(type)) return this.advance();
    throw this.error(this.peek(), message);
};
Parser.prototype.error = function (token, message) {
    var where = token.type === TT.EOF ? ' at end' : " at '" + token.lexeme + "'";
    reportError(token.line, message + where);
    return new LoxParseError();
};
Parser.prototype.synchronize = function () {
    this.advance();
    while (!this.isAtEnd()) {
        if (this.previous().type === TT.SEMICOLON) return;
        switch (this.peek().type) {
            case TT.CLASS: case TT.FUN: case TT.VAR: case TT.FOR:
            case TT.IF: case TT.WHILE: case TT.PRINT: case TT.RETURN: return;
        }
        this.advance();
    }
};

Parser.prototype.parse = function () {
    var statements = [];
    while (!this.isAtEnd()) statements.push(this.declaration());
    return statements;
};

Parser.prototype.declaration = function () {
    try {
        if (this.match(TT.CLASS)) return this.classDeclaration();
        if (this.match(TT.FUN))   return this.functionDecl('function');
        if (this.match(TT.VAR))   return this.varDeclaration();
        return this.statement();
    } catch (e) {
        if (e.isLoxParseError) { this.synchronize(); return null; }
        throw e;
    }
};

Parser.prototype.classDeclaration = function () {
    var name = this.consume(TT.IDENTIFIER, 'Expect class name.');
    var superclass = null;
    if (this.match(TT.LESS)) {
        this.consume(TT.IDENTIFIER, 'Expect superclass name.');
        superclass = { kind: 'Variable', name: this.previous() };
    }
    this.consume(TT.LEFT_BRACE, "Expect '{' before class body.");
    var methods = [];
    while (!this.check(TT.RIGHT_BRACE) && !this.isAtEnd()) methods.push(this.functionDecl('method'));
    this.consume(TT.RIGHT_BRACE, "Expect '}' after class body.");
    return { kind: 'Class', name: name, superclass: superclass, methods: methods };
};

Parser.prototype.functionDecl = function (kindName) {
    var name = this.consume(TT.IDENTIFIER, 'Expect ' + kindName + ' name.');
    this.consume(TT.LEFT_PAREN, "Expect '(' after " + kindName + ' name.');
    var params = [];
    if (!this.check(TT.RIGHT_PAREN)) {
        do { params.push(this.consume(TT.IDENTIFIER, 'Expect parameter name.')); } while (this.match(TT.COMMA));
    }
    this.consume(TT.RIGHT_PAREN, "Expect ')' after parameters.");
    this.consume(TT.LEFT_BRACE, "Expect '{' before " + kindName + ' body.');
    var body = this.block();
    return { kind: 'Function', name: name, params: params, body: body };
};

Parser.prototype.varDeclaration = function () {
    var name = this.consume(TT.IDENTIFIER, 'Expect variable name.');
    var initializer = null;
    if (this.match(TT.EQUAL)) initializer = this.expression();
    this.consume(TT.SEMICOLON, "Expect ';' after variable declaration.");
    return { kind: 'Var', name: name, initializer: initializer };
};

Parser.prototype.statement = function () {
    if (this.match(TT.FOR)) return this.forStatement();
    if (this.match(TT.IF)) return this.ifStatement();
    if (this.match(TT.PRINT)) return this.printStatement();
    if (this.match(TT.RETURN)) return this.returnStatement();
    if (this.match(TT.WHILE)) return this.whileStatement();
    if (this.match(TT.LEFT_BRACE)) return { kind: 'Block', statements: this.block() };
    return this.expressionStatement();
};

/* for (init; cond; incr) body → desugars to { init; while(cond) { body; incr; } } */
Parser.prototype.forStatement = function () {
    var keyword = this.previous();
    this.consume(TT.LEFT_PAREN, "Expect '(' after 'for'.");
    var initializer;
    if (this.match(TT.SEMICOLON)) initializer = null;
    else if (this.match(TT.VAR)) initializer = this.varDeclaration();
    else initializer = this.expressionStatement();

    var condition = null;
    if (!this.check(TT.SEMICOLON)) condition = this.expression();
    this.consume(TT.SEMICOLON, "Expect ';' after loop condition.");

    var increment = null;
    if (!this.check(TT.RIGHT_PAREN)) increment = this.expression();
    this.consume(TT.RIGHT_PAREN, "Expect ')' after for clauses.");

    var body = this.statement();
    if (increment !== null) body = { kind: 'Block', statements: [body, { kind: 'Expression', expression: increment }] };
    if (condition === null) condition = { kind: 'Literal', value: true };
    body = { kind: 'While', keyword: keyword, condition: condition, body: body };
    if (initializer !== null) body = { kind: 'Block', statements: [initializer, body] };
    return body;
};

Parser.prototype.ifStatement = function () {
    this.consume(TT.LEFT_PAREN, "Expect '(' after 'if'.");
    var condition = this.expression();
    this.consume(TT.RIGHT_PAREN, "Expect ')' after if condition.");
    var thenBranch = this.statement();
    var elseBranch = this.match(TT.ELSE) ? this.statement() : null;
    return { kind: 'If', condition: condition, thenBranch: thenBranch, elseBranch: elseBranch };
};

Parser.prototype.printStatement = function () {
    var value = this.expression();
    this.consume(TT.SEMICOLON, "Expect ';' after value.");
    return { kind: 'Print', expression: value };
};

Parser.prototype.returnStatement = function () {
    var keyword = this.previous();
    var value = this.check(TT.SEMICOLON) ? null : this.expression();
    this.consume(TT.SEMICOLON, "Expect ';' after return value.");
    return { kind: 'Return', keyword: keyword, value: value };
};

Parser.prototype.whileStatement = function () {
    var keyword = this.previous();
    this.consume(TT.LEFT_PAREN, "Expect '(' after 'while'.");
    var condition = this.expression();
    this.consume(TT.RIGHT_PAREN, "Expect ')' after condition.");
    var body = this.statement();
    return { kind: 'While', keyword: keyword, condition: condition, body: body };
};

Parser.prototype.expressionStatement = function () {
    var expr = this.expression();
    this.consume(TT.SEMICOLON, "Expect ';' after expression.");
    return { kind: 'Expression', expression: expr };
};

Parser.prototype.block = function () {
    var statements = [];
    while (!this.check(TT.RIGHT_BRACE) && !this.isAtEnd()) statements.push(this.declaration());
    this.consume(TT.RIGHT_BRACE, "Expect '}' after block.");
    return statements;
};

/* ---- Expressions, lowest to highest precedence ---- */
Parser.prototype.expression = function () { return this.assignment(); };

Parser.prototype.assignment = function () {
    var expr = this.or_();
    if (this.match(TT.EQUAL)) {
        var equals = this.previous();
        var value = this.assignment();
        if (expr.kind === 'Variable') return { kind: 'Assign', name: expr.name, value: value };
        if (expr.kind === 'Get') return { kind: 'Set', object: expr.object, name: expr.name, value: value };
        this.error(equals, 'Invalid assignment target.');
    }
    return expr;
};

Parser.prototype.or_ = function () {
    var expr = this.and_();
    while (this.match(TT.OR)) { var op = this.previous(); expr = { kind: 'Logical', left: expr, operator: op, right: this.and_() }; }
    return expr;
};
Parser.prototype.and_ = function () {
    var expr = this.equality();
    while (this.match(TT.AND)) { var op = this.previous(); expr = { kind: 'Logical', left: expr, operator: op, right: this.equality() }; }
    return expr;
};
Parser.prototype.equality = function () {
    var expr = this.comparison();
    while (this.match(TT.BANG_EQUAL, TT.EQUAL_EQUAL)) { var op = this.previous(); expr = { kind: 'Binary', left: expr, operator: op, right: this.comparison() }; }
    return expr;
};
Parser.prototype.comparison = function () {
    var expr = this.term();
    while (this.match(TT.GREATER, TT.GREATER_EQUAL, TT.LESS, TT.LESS_EQUAL)) { var op = this.previous(); expr = { kind: 'Binary', left: expr, operator: op, right: this.term() }; }
    return expr;
};
Parser.prototype.term = function () {
    var expr = this.factor();
    while (this.match(TT.MINUS, TT.PLUS)) { var op = this.previous(); expr = { kind: 'Binary', left: expr, operator: op, right: this.factor() }; }
    return expr;
};
Parser.prototype.factor = function () {
    var expr = this.unary();
    while (this.match(TT.SLASH, TT.STAR)) { var op = this.previous(); expr = { kind: 'Binary', left: expr, operator: op, right: this.unary() }; }
    return expr;
};
Parser.prototype.unary = function () {
    if (this.match(TT.BANG, TT.MINUS)) { var op = this.previous(); return { kind: 'Unary', operator: op, right: this.unary() }; }
    return this.call();
};
Parser.prototype.call = function () {
    var expr = this.primary();
    while (true) {
        if (this.match(TT.LEFT_PAREN)) expr = this.finishCall(expr);
        else if (this.match(TT.DOT)) {
            var name = this.consume(TT.IDENTIFIER, "Expect property name after '.'.");
            expr = { kind: 'Get', object: expr, name: name };
        } else break;
    }
    return expr;
};
Parser.prototype.finishCall = function (callee) {
    var args = [];
    if (!this.check(TT.RIGHT_PAREN)) { do { args.push(this.expression()); } while (this.match(TT.COMMA)); }
    var paren = this.consume(TT.RIGHT_PAREN, "Expect ')' after arguments.");
    return { kind: 'Call', callee: callee, paren: paren, args: args };
};
Parser.prototype.primary = function () {
    if (this.match(TT.FALSE)) return { kind: 'Literal', value: false };
    if (this.match(TT.TRUE)) return { kind: 'Literal', value: true };
    if (this.match(TT.NIL)) return { kind: 'Literal', value: null };
    if (this.match(TT.NUMBER, TT.STRING)) return { kind: 'Literal', value: this.previous().literal };
    if (this.match(TT.SUPER)) {
        var keyword = this.previous();
        this.consume(TT.DOT, "Expect '.' after 'super'.");
        var method = this.consume(TT.IDENTIFIER, 'Expect superclass method name.');
        return { kind: 'Super', keyword: keyword, method: method };
    }
    if (this.match(TT.THIS)) return { kind: 'This', keyword: this.previous() };
    if (this.match(TT.IDENTIFIER)) return { kind: 'Variable', name: this.previous() };
    if (this.match(TT.LEFT_PAREN)) {
        var expr = this.expression();
        this.consume(TT.RIGHT_PAREN, "Expect ')' after expression.");
        return { kind: 'Grouping', expression: expr };
    }
    throw this.error(this.peek(), 'Expect expression.');
};

/* ════════════════════════════════════════════════════════════
   ENVIRONMENT, scope chain. Mirrors Environment.java.
════════════════════════════════════════════════════════════ */
function LoxEnvironment(enclosing) {
    this.enclosing = enclosing || null;
    this.values = new Map();
}
LoxEnvironment.prototype.define = function (name, value) { this.values.set(name, value); };
LoxEnvironment.prototype.get = function (nameToken) {
    if (this.values.has(nameToken.lexeme)) return this.values.get(nameToken.lexeme);
    if (this.enclosing) return this.enclosing.get(nameToken);
    throw new LoxRuntimeError(nameToken, "Undefined variable '" + nameToken.lexeme + "'.");
};
LoxEnvironment.prototype.assign = function (nameToken, value) {
    if (this.values.has(nameToken.lexeme)) { this.values.set(nameToken.lexeme, value); return; }
    if (this.enclosing) { this.enclosing.assign(nameToken, value); return; }
    throw new LoxRuntimeError(nameToken, "Undefined variable '" + nameToken.lexeme + "'.");
};

/* ════════════════════════════════════════════════════════════
   CALLABLES, functions, classes, and instances.
   Mirrors LoxCallable/LoxFunction/LoxClass/LoxInstance.java.
════════════════════════════════════════════════════════════ */
function LoxReturn(value) { this.value = value; this.isLoxReturn = true; }

function LoxFunction(declaration, closure, isInitializer) {
    this.declaration = declaration; this.closure = closure; this.isInitializer = isInitializer;
}
LoxFunction.prototype.arity = function () { return this.declaration.params.length; };
LoxFunction.prototype.bind = function (instance) {
    var env = new LoxEnvironment(this.closure);
    env.define('this', instance);
    return new LoxFunction(this.declaration, env, this.isInitializer);
};
LoxFunction.prototype.call = function (interpreter, args) {
    var env = new LoxEnvironment(this.closure);
    for (var i = 0; i < this.declaration.params.length; i++) env.define(this.declaration.params[i].lexeme, args[i]);
    try {
        interpreter.executeBlock(this.declaration.body, env);
    } catch (e) {
        if (e.isLoxReturn) {
            if (this.isInitializer) return this.closure.get({ lexeme: 'this' });
            return e.value;
        }
        throw e;
    }
    if (this.isInitializer) return this.closure.get({ lexeme: 'this' });
    return null;
};
LoxFunction.prototype.toString = function () { return '<fn ' + this.declaration.name.lexeme + '>'; };

function LoxClass(name, superclass, methods) {
    this.name = name; this.superclass = superclass; this.methods = methods;
}
LoxClass.prototype.findMethod = function (name) {
    if (this.methods.has(name)) return this.methods.get(name);
    if (this.superclass) return this.superclass.findMethod(name);
    return null;
};
LoxClass.prototype.arity = function () {
    var init = this.findMethod('init');
    return init ? init.arity() : 0;
};
LoxClass.prototype.call = function (interpreter, args) {
    var instance = new LoxInstance(this);
    var initializer = this.findMethod('init');
    if (initializer) initializer.bind(instance).call(interpreter, args);
    return instance;
};
LoxClass.prototype.toString = function () { return this.name; };

function LoxInstance(klass) { this.klass = klass; this.fields = new Map(); }
LoxInstance.prototype.get = function (nameToken) {
    if (this.fields.has(nameToken.lexeme)) return this.fields.get(nameToken.lexeme);
    var method = this.klass.findMethod(nameToken.lexeme);
    if (method) return method.bind(this);
    throw new LoxRuntimeError(nameToken, "Undefined property '" + nameToken.lexeme + "'.");
};
LoxInstance.prototype.set = function (nameToken, value) { this.fields.set(nameToken.lexeme, value); };
LoxInstance.prototype.toString = function () { return this.klass.name + ' instance'; };

/* ════════════════════════════════════════════════════════════
   INTERPRETER, walks the AST and evaluates it directly.
   Mirrors Interpreter.java.
════════════════════════════════════════════════════════════ */
/* Everything runs on the main thread, so an endless loop would freeze the
   tab. Each loop pass and function call uses one step, and the program
   stops with an error once the budget runs out. Not in the Java version. */
var LOX_STEP_LIMIT = 1000000;

function Interpreter(printFn) {
    this.printFn = printFn;
    this.steps = 0;
    this.globals = new LoxEnvironment(null);
    this.environment = this.globals;

    this.globals.define('clock', {
        arity: function () { return 0; },
        call: function () { return Date.now() / 1000.0; },
        toString: function () { return '<native fn>'; },
    });
}

Interpreter.prototype.interpret = function (statements) {
    try {
        for (var i = 0; i < statements.length; i++) this.execute(statements[i]);
    } catch (e) {
        if (e.isLoxRuntimeError) {
            loxErrors.push({ line: e.token.line, message: e.message, runtime: true });
        } else {
            throw e;
        }
    }
};

Interpreter.prototype.execute = function (stmt) {
    if (!stmt) return;
    switch (stmt.kind) {
        case 'Expression': this.evaluate(stmt.expression); return;
        case 'Print': this.printFn(this.stringify(this.evaluate(stmt.expression))); return;
        case 'Var':
            this.environment.define(stmt.name.lexeme, stmt.initializer ? this.evaluate(stmt.initializer) : null);
            return;
        case 'Block': this.executeBlock(stmt.statements, new LoxEnvironment(this.environment)); return;
        case 'If':
            if (this.isTruthy(this.evaluate(stmt.condition))) this.execute(stmt.thenBranch);
            else if (stmt.elseBranch) this.execute(stmt.elseBranch);
            return;
        case 'While':
            while (this.isTruthy(this.evaluate(stmt.condition))) {
                this.useStep(stmt.keyword);
                this.execute(stmt.body);
            }
            return;
        case 'Function': {
            var fn = new LoxFunction(stmt, this.environment, false);
            this.environment.define(stmt.name.lexeme, fn);
            return;
        }
        case 'Return': throw new LoxReturn(stmt.value ? this.evaluate(stmt.value) : null);
        case 'Class': return this.executeClass(stmt);
    }
};

Interpreter.prototype.executeClass = function (stmt) {
    var superclass = null;
    if (stmt.superclass) {
        superclass = this.evaluate(stmt.superclass);
        if (!(superclass instanceof LoxClass)) {
            throw new LoxRuntimeError(stmt.superclass.name, 'Superclass must be a class.');
        }
    }

    this.environment.define(stmt.name.lexeme, null);

    var previousEnv = this.environment;
    if (stmt.superclass) {
        this.environment = new LoxEnvironment(this.environment);
        this.environment.define('super', superclass);
    }

    var methods = new Map();
    for (var i = 0; i < stmt.methods.length; i++) {
        var m = stmt.methods[i];
        methods.set(m.name.lexeme, new LoxFunction(m, this.environment, m.name.lexeme === 'init'));
    }

    var klass = new LoxClass(stmt.name.lexeme, superclass, methods);
    if (stmt.superclass) this.environment = previousEnv;
    this.environment.assign(stmt.name, klass);
};

Interpreter.prototype.executeBlock = function (statements, env) {
    var previous = this.environment;
    try {
        this.environment = env;
        for (var i = 0; i < statements.length; i++) this.execute(statements[i]);
    } finally {
        this.environment = previous;
    }
};

Interpreter.prototype.evaluate = function (expr) {
    switch (expr.kind) {
        case 'Literal': return expr.value;
        case 'Grouping': return this.evaluate(expr.expression);
        case 'Variable': return this.environment.get(expr.name);
        case 'This': return this.environment.get(expr.keyword);
        case 'Unary': return this.evalUnary(expr);
        case 'Binary': return this.evalBinary(expr);
        case 'Logical': return this.evalLogical(expr);
        case 'Assign': {
            var value = this.evaluate(expr.value);
            this.environment.assign(expr.name, value);
            return value;
        }
        case 'Call': return this.evalCall(expr);
        case 'Get': {
            var object = this.evaluate(expr.object);
            if (object instanceof LoxInstance) return object.get(expr.name);
            throw new LoxRuntimeError(expr.name, 'Only instances have properties.');
        }
        case 'Set': {
            var obj = this.evaluate(expr.object);
            if (!(obj instanceof LoxInstance)) throw new LoxRuntimeError(expr.name, 'Only instances have fields.');
            var val = this.evaluate(expr.value);
            obj.set(expr.name, val);
            return val;
        }
        case 'Super': return this.evalSuper(expr);
    }
};

Interpreter.prototype.evalUnary = function (expr) {
    var right = this.evaluate(expr.right);
    switch (expr.operator.type) {
        case TT.MINUS: this.checkNumberOperand(expr.operator, right); return -right;
        case TT.BANG: return !this.isTruthy(right);
    }
};

Interpreter.prototype.evalBinary = function (expr) {
    var left = this.evaluate(expr.left);
    var right = this.evaluate(expr.right);
    switch (expr.operator.type) {
        case TT.MINUS: this.checkNumberOperands(expr.operator, left, right); return left - right;
        case TT.SLASH:
            this.checkNumberOperands(expr.operator, left, right);
            if (right === 0) throw new LoxRuntimeError(expr.operator, 'Division by zero.');
            return left / right;
        case TT.STAR: this.checkNumberOperands(expr.operator, left, right); return left * right;
        case TT.PLUS:
            if (typeof left === 'number' && typeof right === 'number') return left + right;
            if (typeof left === 'string' || typeof right === 'string') return this.stringify(left) + this.stringify(right);
            throw new LoxRuntimeError(expr.operator, 'Operands must be two numbers or two strings.');
        case TT.GREATER: this.checkNumberOperands(expr.operator, left, right); return left > right;
        case TT.GREATER_EQUAL: this.checkNumberOperands(expr.operator, left, right); return left >= right;
        case TT.LESS: this.checkNumberOperands(expr.operator, left, right); return left < right;
        case TT.LESS_EQUAL: this.checkNumberOperands(expr.operator, left, right); return left <= right;
        case TT.BANG_EQUAL: return !this.isEqual(left, right);
        case TT.EQUAL_EQUAL: return this.isEqual(left, right);
    }
};

Interpreter.prototype.evalLogical = function (expr) {
    var left = this.evaluate(expr.left);
    if (expr.operator.type === TT.OR) { if (this.isTruthy(left)) return left; }
    else { if (!this.isTruthy(left)) return left; }
    return this.evaluate(expr.right);
};

Interpreter.prototype.evalCall = function (expr) {
    var callee = this.evaluate(expr.callee);
    var args = expr.args.map(function (a) { return this.evaluate(a); }, this);

    var isCallable = callee instanceof LoxClass || callee instanceof LoxFunction ||
        (callee && typeof callee.call === 'function' && typeof callee.arity === 'function');
    if (!isCallable) throw new LoxRuntimeError(expr.paren, 'Can only call functions and classes.');
    if (args.length !== callee.arity()) {
        throw new LoxRuntimeError(expr.paren, 'Expected ' + callee.arity() + ' arguments but got ' + args.length + '.');
    }
    this.useStep(expr.paren);
    return callee.call(this, args);
};

Interpreter.prototype.useStep = function (token) {
    if (++this.steps > LOX_STEP_LIMIT) {
        throw new LoxRuntimeError(token, 'Stopped after ' + LOX_STEP_LIMIT.toLocaleString('en-US') + ' steps. Is there an endless loop?');
    }
};

Interpreter.prototype.evalSuper = function (expr) {
    var superclass = this.environment.get({ lexeme: 'super', line: expr.keyword.line });
    var object = this.environment.get({ lexeme: 'this', line: expr.keyword.line });
    var method = superclass.findMethod(expr.method.lexeme);
    if (!method) throw new LoxRuntimeError(expr.method, "Undefined property '" + expr.method.lexeme + "'.");
    return method.bind(object);
};

Interpreter.prototype.isTruthy = function (v) { return v !== null && v !== false; };
Interpreter.prototype.isEqual = function (a, b) { return a === b; };
Interpreter.prototype.checkNumberOperand = function (op, v) {
    if (typeof v === 'number') return;
    throw new LoxRuntimeError(op, 'Operand must be a number.');
};
Interpreter.prototype.checkNumberOperands = function (op, l, r) {
    if (typeof l === 'number' && typeof r === 'number') return;
    throw new LoxRuntimeError(op, 'Operands must be numbers.');
};
Interpreter.prototype.stringify = function (v) {
    if (v === null || v === undefined) return 'nil';
    if (typeof v === 'number') {
        var text = String(v);
        return text.endsWith('.0') ? text.slice(0, -2) : text; // no trailing .0, matches Java's Double.toString path
    }
    return String(v);
};

/* ════════════════════════════════════════════════════════════
   RUN, scan, parse, interpret. Wired to the UI below.
════════════════════════════════════════════════════════════ */
function runLox(source, printFn) {
    loxErrors = [];
    var scanner = new Scanner(source);
    var tokens = scanner.scanTokens();
    if (loxErrors.length > 0) return loxErrors;

    var parser = new Parser(tokens);
    var statements = parser.parse();
    if (loxErrors.length > 0) return loxErrors;

    var interpreter = new Interpreter(printFn);
    interpreter.interpret(statements);
    return loxErrors;
}

/* ════════════════════════════════════════════════════════════
   UI WIRING
════════════════════════════════════════════════════════════ */
(function () {
    var EXAMPLES = {
        hello: '// Variables, arithmetic, and print\nvar a = 10;\nvar b = 20;\nprint a + b;\n\nvar name = "world";\nprint "Hello, " + name + "!";\n',
        closures: '// Closures, makeCounter returns a function that\n// remembers its own local variable across calls\nfun makeCounter() {\n    var count = 0;\n    fun increment() {\n        count = count + 1;\n        return count;\n    }\n    return increment;\n}\n\nvar counter = makeCounter();\nprint counter();\nprint counter();\nprint counter();\n\nfun fibonacci(n) {\n    if (n <= 1) return n;\n    return fibonacci(n - 1) + fibonacci(n - 2);\n}\nprint fibonacci(10);\n',
        classes: '// Classes with inheritance\nclass Animal {\n    init(name) {\n        this.name = name;\n    }\n    speak() {\n        print this.name + " makes a sound.";\n    }\n}\n\nclass Dog < Animal {\n    speak() {\n        print this.name + " barks.";\n    }\n    fetch() {\n        super.speak();\n        print this.name + " fetches the ball!";\n    }\n}\n\nvar d = Dog("Rex");\nd.speak();\nd.fetch();\n',
        fstring: '// String interpolation, my own extension to the language,\n// not part of the book. Implemented in the scanner: f"..."\n// is split into literal and {expr} segments at lex time.\nvar greeting = "Hello";\nvar name = "world";\nprint f"{greeting}, {name}!";\n\nvar a = 6;\nvar b = 7;\nprint f"{a} times {b} is {a * b}";\n',
    };

    var editor = document.getElementById('loxEditor');
    var output = document.getElementById('loxOutput');

    function appendLine(text, cls) {
        var line = document.createElement('div');
        line.className = 'lox-out-line';
        var marker = document.createElement('span');
        marker.className = 'lox-out-marker';
        marker.textContent = cls === 'lox-out-error' ? '✕' : '›';
        var msg = document.createElement('span');
        msg.className = cls;
        msg.textContent = text;
        line.appendChild(marker);
        line.appendChild(msg);
        output.appendChild(line);
        output.scrollTop = output.scrollHeight;
    }

    function run() {
        output.innerHTML = '';
        var source = editor.value;
        var printed = 0;
        var MAX_LINES = 1000;

        var errors;
        try {
            errors = runLox(source, function (text) {
                if (printed++ < MAX_LINES) appendLine(text, 'lox-out-print');
            });
        } catch (e) {
            var msg = e instanceof RangeError ? 'Too much recursion.' : e.message;
            appendLine('Internal error: ' + msg, 'lox-out-error');
            return;
        }
        if (printed > MAX_LINES) {
            appendLine('(' + (printed - MAX_LINES).toLocaleString('en-US') + ' more lines not shown)', 'lox-out-muted');
        }

        if (errors.length > 0) {
            errors.forEach(function (err) {
                appendLine('[line ' + err.line + '] ' + (err.runtime ? 'Runtime error: ' : 'Error: ') + err.message, 'lox-out-error');
            });
        } else if (printed === 0) {
            appendLine('(no output, try adding a print statement)', 'lox-out-muted');
        }
    }

    document.getElementById('loxRun').addEventListener('click', run);
    document.getElementById('loxClear').addEventListener('click', function () { output.innerHTML = ''; });

    document.getElementById('loxExample').addEventListener('change', function () {
        editor.value = EXAMPLES[this.value];
        run();
    });

    editor.value = EXAMPLES.closures;
    run();
})();

/* ════════════════════════════════════════════════════════════
   CODE VIEWER, actual Java source files
════════════════════════════════════════════════════════════ */
(function () {
    var SRC = {};

    SRC.scanner = String.raw`// The Scanner (lexer) converts raw source text into a list of tokens.
// It's a single pass through the source string, character by character.
public class Scanner {
    private final String source;
    private final List<Token> tokens = new ArrayList<>();
    private int start = 0, current = 0, line = 1;

    private void scanToken() {
        char c = advance();
        switch (c) {
            case '(': addToken(TokenType.LEFT_PAREN);  break;
            case ')': addToken(TokenType.RIGHT_PAREN); break;
            // ... one-character tokens ...

            case '!': addToken(match('=') ? TokenType.BANG_EQUAL : TokenType.BANG); break;
            case '=': addToken(match('=') ? TokenType.EQUAL_EQUAL : TokenType.EQUAL); break;

            case '/':
                if (match('/')) {
                    while (peek() != '\n' && !isAtEnd()) advance(); // line comment
                } else {
                    addToken(TokenType.SLASH);
                }
                break;

            case '"': string(); break;

            default:
                if (isDigit(c)) number();
                else if (isAlpha(c)) identifier();
                else Lox.error(line, "Unexpected character.");
        }
    }

    // f"...", my custom string-interpolation extension.
    // Splits into literal + {expr} segments, then emits them as a
    // chain of string concatenations: f"{a}, {b}!" -> ( (a) + ", " + (b) + "!" )
    private void fstring() {
        List<Object> segments = new ArrayList<>();
        StringBuilder literal = new StringBuilder();

        while (!isAtEnd() && peek() != '"') {
            if (peek() == '{') {
                if (literal.length() > 0) { segments.add(literal.toString()); literal.setLength(0); }
                advance();
                int depth = 1, exprStart = current;
                while (!isAtEnd() && depth > 0) {
                    char ch = advance();
                    if (ch == '{') depth++;
                    else if (ch == '}') depth--;
                }
                String exprSource = source.substring(exprStart, current - 1);
                Scanner inner = new Scanner(exprSource);
                List<Token> exprTokens = inner.scanTokens();
                exprTokens.remove(exprTokens.size() - 1); // drop inner EOF
                segments.add(exprTokens);
            } else {
                literal.append(advance());
            }
        }
        // ... emit segments as PLUS-joined STRING/expression tokens ...
    }
}`;

    SRC.environment = String.raw`// Environment stores variables and implements lexical scoping.
// Each block/function creates a new Environment with a pointer to its
// enclosing scope. This is where closures work: a LoxFunction holds a
// reference to the Environment that was active when it was defined.
public class Environment {
    final Environment enclosing;
    private final Map<String, Object> values = new HashMap<>();

    public Environment(Environment enclosing) { this.enclosing = enclosing; }

    public Object get(Token name) {
        if (values.containsKey(name.lexeme)) return values.get(name.lexeme);
        if (enclosing != null) return enclosing.get(name); // walk up the chain
        throw new RuntimeError(name, "Undefined variable '" + name.lexeme + "'.");
    }

    public void define(String name, Object value) {
        values.put(name, value);
    }

    public void assign(Token name, Object value) {
        if (values.containsKey(name.lexeme)) { values.put(name.lexeme, value); return; }
        if (enclosing != null) { enclosing.assign(name, value); return; }
        throw new RuntimeError(name, "Undefined variable '" + name.lexeme + "'.");
    }
}`;

    SRC.loxfunction = String.raw`// A first-class Lox function, stores its declaration and the closure
// environment. The closure captures the scope where the function was
// DEFINED, not where it's called. That's how closures work: makeCounter()
// returns a function that "remembers" count.
public class LoxFunction implements LoxCallable {
    private final Stmt.Function declaration;
    private final Environment closure;
    private final boolean isInitializer;

    // bind() creates a new function with "this" added to its closure, used for methods
    public LoxFunction bind(LoxInstance instance) {
        Environment environment = new Environment(closure);
        environment.define("this", instance);
        return new LoxFunction(declaration, environment, isInitializer);
    }

    @Override
    public Object call(Interpreter interpreter, List<Object> arguments) {
        Environment environment = new Environment(closure);
        for (int i = 0; i < declaration.params.size(); i++) {
            environment.define(declaration.params.get(i).lexeme, arguments.get(i));
        }
        try {
            interpreter.executeBlock(declaration.body, environment);
        } catch (Return returnValue) {
            if (isInitializer) return closure.getAt(0, "this");
            return returnValue.value;
        }
        if (isInitializer) return closure.getAt(0, "this");
        return null;
    }
}`;

    SRC.interpreter = String.raw`// Tree-walking interpreter, visits each AST node and directly executes it.
// No compilation step: walk the tree, evaluate, done.
public class Interpreter implements Expr.Visitor<Object>, Stmt.Visitor<Void> {
    final Environment globals = new Environment();
    private Environment environment = globals;

    @Override
    public Object visitBinaryExpr(Expr.Binary expr) {
        Object left  = evaluate(expr.left);
        Object right = evaluate(expr.right);

        switch (expr.operator.type) {
            case PLUS:
                if (left instanceof Double && right instanceof Double)
                    return (double) left + (double) right;
                if (left instanceof String || right instanceof String)
                    return stringify(left) + stringify(right); // auto-coerce for string concat
                throw new RuntimeError(expr.operator, "Operands must be two numbers or two strings.");
            case SLASH:
                checkNumberOperands(expr.operator, left, right);
                if ((double) right == 0) throw new RuntimeError(expr.operator, "Division by zero.");
                return (double) left / (double) right;
            // ... MINUS, STAR, comparisons, equality ...
        }
    }

    void executeBlock(List<Stmt> statements, Environment environment) {
        Environment previous = this.environment;
        try {
            this.environment = environment;
            for (Stmt statement : statements) execute(statement);
        } finally {
            this.environment = previous; // always restore, even if an exception is thrown
        }
    }
}`;

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
    loadCode('interpreter');
})();
