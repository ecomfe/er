<!-- target: bookList -->
<aside id="sidebar">
</aside>
<ol id="book-list">
    <!-- for: ${list} as ${book} -->
    <li>
        <a href="#/book/view~isbn=${book.isbn}" class="image" title="点击查看《${book.name}》详细信息">
            <img src="asset/img/book/${book.isbn}.jpg" alt="图书图片" width="160" height="160" />
        </a>
        <a href="#/book/view~isbn=${book.isbn}" class="name" title="点击查看《${book.name}》详细信息">${book.name}</a>
        <ul class="summary">
            <li class="author">
                <span class="key">作　　者</span>
                <a href="#/book/list~author=${book.author|url}" class="value">${book.author}</a>
            </li>
            <li class="publisher">
                <span class="key">出 版 社</span>
                <a href="#/book/list~publisher=${book.publisher|url}" class="value">${book.publisher}</a>
            </li>
            <li class="publish-date">
                <span class="key">出版时间</span>
                <span class="value">${book.publishDate}</span>
            </li>
            <li class="price">
                <span class="key">定　　价</span>
                <span class="value">${book.price}</span>
            </li>
        </ul>
        <div class="action">
            <span class="buy" data-isbn="${item.isbn}">加入购物车</span>
        </div>
    </li>
    <!-- /for -->
</ol>