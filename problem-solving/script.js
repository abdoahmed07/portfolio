/* ════════════════════════════════════════════════════════════
   Problem Solving, LeetCode practice from the summer prep
   The interactive demo runs the exact DFS from week7's
   num_islands(), animated cell by cell as it actually recurses.
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
   NUMBER OF ISLANDS, animated DFS
   Mirrors week7_graphs.py's num_islands() exactly: for every
   unvisited '1', flood-fill the whole island with DFS and count.
════════════════════════════════════════════════════════════ */
(function () {
    var ROWS = 8, COLS = 10;
    var grid = [];
    var cellEls = [];
    var running = false;

    var gridEl = document.getElementById('islandsGrid');
    gridEl.style.gridTemplateColumns = 'repeat(' + COLS + ', 32px)';

    function randomGrid() {
        grid = [];
        for (var r = 0; r < ROWS; r++) {
            var row = [];
            for (var c = 0; c < COLS; c++) row.push(Math.random() < 0.45 ? '1' : '0');
            grid.push(row);
        }
    }

    function render() {
        gridEl.innerHTML = '';
        cellEls = [];
        for (var r = 0; r < ROWS; r++) {
            var rowEls = [];
            for (var c = 0; c < COLS; c++) {
                var cell = document.createElement('button');
                cell.type = 'button';
                cell.className = 'island-cell' + (grid[r][c] === '1' ? ' land' : '');
                cell.dataset.r = r; cell.dataset.c = c;
                cell.setAttribute('aria-label', 'Row ' + (r + 1) + ', column ' + (c + 1));
                cell.setAttribute('aria-pressed', String(grid[r][c] === '1'));
                cell.addEventListener('click', function () {
                    if (running) return;
                    var rr = parseInt(this.dataset.r), cc = parseInt(this.dataset.c);
                    var hadFocus = document.activeElement === this;
                    grid[rr][cc] = grid[rr][cc] === '1' ? '0' : '1';
                    render();
                    // the grid is rebuilt, so put keyboard focus back on the same cell
                    if (hadFocus) cellEls[rr][cc].focus();
                });
                gridEl.appendChild(cell);
                rowEls.push(cell);
            }
            cellEls.push(rowEls);
        }
        setStatus(0);
    }

    function setStatus(count, done) {
        document.getElementById('islandsStatus').innerHTML =
            (done ? 'Done, ' : '') + '<b>' + count + '</b> island' + (count === 1 ? '' : 's') + (done ? ' found' : '');
    }

    /* Same traversal as the Python version: mark visited in place,
       recurse in all 4 directions, sleep briefly so it's visible. */
    function sleep(ms) { return new Promise(function (res) { setTimeout(res, ms); }); }

    async function dfs(r, c, colorClass, speed) {
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS || grid[r][c] !== '1') return;
        grid[r][c] = '#'; // mark visited, exactly like the Python solution
        cellEls[r][c].className = 'island-cell visiting';
        await sleep(speed);
        cellEls[r][c].className = 'island-cell ' + colorClass;

        await dfs(r + 1, c, colorClass, speed);
        await dfs(r - 1, c, colorClass, speed);
        await dfs(r, c + 1, colorClass, speed);
        await dfs(r, c - 1, colorClass, speed);
    }

    async function countIslands() {
        if (running) return;
        running = true;
        document.getElementById('islandsRun').disabled = true;
        document.getElementById('islandsShuffle').disabled = true;

        var count = 0;
        var speed = 45;
        for (var r = 0; r < ROWS; r++) {
            for (var c = 0; c < COLS; c++) {
                if (grid[r][c] === '1') {
                    var colorClass = 'done' + (count % 5);
                    setStatus(count + 1);
                    await dfs(r, c, colorClass, speed);
                    count++;
                }
            }
        }
        setStatus(count, true);
        running = false;
        document.getElementById('islandsRun').disabled = false;
        document.getElementById('islandsShuffle').disabled = false;
    }

    document.getElementById('islandsRun').addEventListener('click', countIslands);
    document.getElementById('islandsShuffle').addEventListener('click', function () {
        if (running) return;
        randomGrid();
        render();
    });

    randomGrid();
    render();
})();

/* ════════════════════════════════════════════════════════════
   CODE VIEWER, actual Python solutions
════════════════════════════════════════════════════════════ */
(function () {
    var SRC = {};

    SRC.week1 = String.raw`# Week 1, warmup, the classic easy problems

# Two Sum: for each number, the complement (target - num) either
# exists already or we store num for later. O(n) with a hash map.
def two_sum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []


# Valid Parentheses: a stack is the natural fit, push openers,
# and when a closer appears, check it matches the top of the stack.
def is_valid(s: str) -> bool:
    stack = []
    matching = {')': '(', ']': '[', '}': '{'}
    for char in s:
        if char in '([{':
            stack.append(char)
        elif char in ')]}':
            if not stack or stack[-1] != matching[char]:
                return False
            stack.pop()
    return len(stack) == 0


# Reverse Linked List: three pointers, prev/curr/next. Had to draw
# this out on paper before the code made sense.
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def reverse_list(head: ListNode) -> ListNode:
    prev, curr = None, head
    while curr:
        next_node = curr.next  # save before overwriting
        curr.next = prev
        prev = curr
        curr = next_node
    return prev`;

    SRC.week3 = String.raw`# Week 3, arrays and hash maps, the most common interview patterns

from collections import defaultdict

# Group Anagrams: two strings are anagrams if their sorted
# characters match, so the sorted string is the hash map key.
def group_anagrams(strs: list[str]) -> list[list[str]]:
    groups = defaultdict(list)
    for s in strs:
        key = tuple(sorted(s))  # "eat" and "tea" both sort to ('a','e','t')
        groups[key].append(s)
    return list(groups.values())


# Longest Consecutive Sequence: O(n) using a hash set, only start
# counting from the BEGINNING of a sequence (num-1 not in the set).
def longest_consecutive(nums: list[int]) -> int:
    num_set = set(nums)
    best = 0
    for num in num_set:
        if num - 1 not in num_set:
            current, length = num, 1
            while current + 1 in num_set:
                current += 1
                length += 1
            best = max(best, length)
    return best


# Top K Frequent: bucket sort by frequency instead of a full O(n log n) sort.
def top_k_frequent(nums: list[int], k: int) -> list[int]:
    count = defaultdict(int)
    for num in nums:
        count[num] += 1
    buckets = [[] for _ in range(len(nums) + 1)]
    for num, freq in count.items():
        buckets[freq].append(num)
    result = []
    for i in range(len(buckets) - 1, 0, -1):
        for num in buckets[i]:
            result.append(num)
            if len(result) == k:
                return result
    return result`;

    SRC.week5 = String.raw`# Week 5, trees and recursion: solve for the root, trust the
# recursive calls to solve the subtrees.

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val, self.left, self.right = val, left, right


def max_depth(root: TreeNode) -> int:
    if not root:
        return 0
    return 1 + max(max_depth(root.left), max_depth(root.right))


# Validate BST: the common mistake is checking only immediate
# children. The fix is passing down the valid [min, max] range.
def is_valid_bst(root: TreeNode) -> bool:
    def validate(node, min_val, max_val):
        if not node:
            return True
        if not (min_val < node.val < max_val):
            return False
        return (validate(node.left, min_val, node.val) and
                validate(node.right, node.val, max_val))
    return validate(root, float('-inf'), float('inf'))


from collections import deque

# Level Order Traversal: BFS with a queue, track level boundaries
# by snapshotting the queue's size before draining each level.
def level_order(root: TreeNode) -> list[list[int]]:
    if not root:
        return []
    result, queue = [], deque([root])
    while queue:
        level_size = len(queue)
        level = []
        for _ in range(level_size):
            node = queue.popleft()
            level.append(node.val)
            if node.left:  queue.append(node.left)
            if node.right: queue.append(node.right)
        result.append(level)
    return result`;

    SRC.week7 = String.raw`# Week 7, graphs: BFS and DFS. Most graph problems reduce to
# connected components, shortest path, or cycle detection.

# Number of Islands: for every unvisited '1', DFS marks the whole
# connected island as visited ('#') and counts it once.
def num_islands(grid: list[list[str]]) -> int:
    if not grid:
        return 0
    rows, cols = len(grid), len(grid[0])
    count = 0

    def dfs(r, c):
        if r < 0 or r >= rows or c < 0 or c >= cols or grid[r][c] != '1':
            return
        grid[r][c] = '#'  # mark visited in place
        dfs(r+1, c); dfs(r-1, c)
        dfs(r, c+1); dfs(r, c-1)

    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == '1':
                count += 1
                dfs(r, c)
    return count


# Course Schedule: "can you finish all courses" is really just
# "does this directed graph have a cycle". Three-color DFS:
# 0 = unvisited, 1 = in progress (cycle if we see it again), 2 = done.
def can_finish(num_courses: int, prerequisites: list[list[int]]) -> bool:
    adj = [[] for _ in range(num_courses)]
    for course, prereq in prerequisites:
        adj[course].append(prereq)

    state = [0] * num_courses

    def has_cycle(node):
        if state[node] == 1: return True
        if state[node] == 2: return False
        state[node] = 1
        for neighbor in adj[node]:
            if has_cycle(neighbor):
                return True
        state[node] = 2
        return False

    return not any(has_cycle(i) for i in range(num_courses))`;

    var codeBlock = document.getElementById('codeBlock');
    function loadCode(key) {
        codeBlock.textContent = SRC[key];
        codeBlock.removeAttribute('data-highlighted');
        if (window.hljs) hljs.highlightElement(codeBlock);
    }
    document.querySelectorAll('.file-tab').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.file-tab').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            loadCode(btn.dataset.file);
        });
    });
    loadCode('week7');
})();
