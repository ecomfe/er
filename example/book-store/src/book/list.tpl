<!-- target: bookList -->
<table id="book-list">
    <thead>
        <tr>
            <th>书名</th>
            <th>ISBN</th>
            <th>作者</th>
            <th>价格</th>
            <th>操作</th>
        </tr>
    </thead>
    <tbody>
        <!-- for: ${list} as ${item} -->
        <tr data-isbn="${item.isbn}">
            <td>${item.name}</td>
            <td>${item.isbn}</td>
            <td>${item.author}</td>
            <td>${item.price}</td>
            <td>
                <a href="#/book/read~isbn=${isbn}">查看</a>
                <span class="interactive" data-command="buy">购买</span>
            </td>
        </tr>
        <!-- /for -->
    </tbody>
</table>