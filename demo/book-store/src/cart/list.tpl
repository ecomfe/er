<!-- target:cartList -->
<table id="cart-list">
    <col id="product-column" />
    <col id="price-column" />
    <col id="count-column" />
    <col id="action-column" />
    <thead>
        <tr>
            <td>商品</td>
            <td>单价</td>
            <td>数量</td>
            <td>操作</td>
        </tr>
    </thead>
    <tbody>
        <!-- for: ${list} as ${book} -->
        <tr data-isbn="${book.isbn}">
            <td>
                <a href="#/book/view~isbn=${book.isbn}" class="image" 
                    title="点击查看《${book.name}》详细信息">
                    <img src="asset/img/book/${book.isbn}.jpg" 
                        alt="图书图片" width="50" height="50" />
                </a>
                <a href="#/book/view~isbn=${book.isbn}" class="name" 
                    title="点击查看《${book.name}》详细信息">
                    ${book.name}
                </a>
            </td>
            <td><span class="price">${book.price}</span></td>
            <td><span class="minus">-</span><span class="count">${book.count}</span><span class="plus">+</span></td>
            <td>
                <span class="remove interactive">删除</span>
            </td>
        </tr>
        <!-- /for -->
    </tbody>
    <tfoot>
        <tr>
            <td><span id="clear-cart" class="interactive">清空购物车</span></td>
            <td colspan="2">总价：<span id="total-price">${total}</span></td>
        </tr>
    </tfoot>
</table>