<!-- target: bookList -->
<div id="book-list-filter">
    <div id="book-list-order">
        <span class="filter-title">排序</span>
        <a href="#/book/list~keywords=${keywords|url}&amp;author=${author|url}&amp;publisher=${publisher|url}">默认</a>
        <a href="#/book/list~keywords=${keywords|url}&amp;author=${author|url}&amp;publisher=${publisher|url}&amp;order=price">价格</a>
        <a href="#/book/list~keywords=${keywords|url}&amp;author=${author|url}&amp;publisher=${publisher|url}&amp;order=author">作者</a>
        <a href="#/book/list~keywords=${keywords|url}&amp;author=${author|url}&amp;publisher=${publisher|url}&amp;order=publisher">出版社</a>
    </div>
    <div id="book-list-search">
        <input id="keywords" value="${keywords|html}" />
        <span id="submit-search" class="interactive">搜索</span>
    </div>
</div>
<ol id="book-list">
    <!-- for: ${list} as ${book} -->
    <li class="book-info" data-isbn="${book.isbn}">
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
            <span class="interactive buy">加入购物车</span>
        </div>
    </li>
    <!-- /for -->
</ol>
<div id="list-page">
    <a data-page="${page}-1" class="previous <!-- if: ${page} == 1 -->disable<!-- /if -->">上一页</a>
    <!-- for: ${pages} as ${p} -->
    <a data-page="${p}" class="index <!-- if: ${p} == ${page} -->disable current<!-- /if -->">${p}</a>
    <!-- /for -->
    <a data-page="${page}+1" class="next <!-- if: ${page} == ${pageCount} -->disable<!-- /if -->">下一页</a>
</div>
<div id="book-info">
    <span id="close-book-info">关闭</span>
    <div id="book-info-panel"></div>
</div>