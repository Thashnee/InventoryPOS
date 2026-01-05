from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from models import db, Product, Sale, SaleItem
from datetime import datetime
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.units import inch
import os

app = Flask(__name__)
CORS(app)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://inventory_user:inventory_pass@localhost:5432/inventory_db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# Initialize database
with app.app_context():
    db.create_all()
    print("Database initialized!")

# Product endpoints
@app.route('/api/products', methods=['GET'])
def get_products():
    products = Product.query.all()
    return jsonify([p.to_dict() for p in products])

@app.route('/api/products/<int:id>', methods=['GET'])
def get_product(id):
    product = Product.query.get_or_404(id)
    return jsonify(product.to_dict())

@app.route('/api/products', methods=['POST'])
def create_product():
    data = request.json
    product = Product(
        name=data['name'],
        sku=data['sku'],
        description=data.get('description', ''),
        price=data['price'],
        cost=data.get('cost', 0),
        quantity=data.get('quantity', 0),
        min_stock=data.get('min_stock', 5),
        category=data.get('category', '')
    )
    db.session.add(product)
    db.session.commit()
    return jsonify(product.to_dict()), 201

@app.route('/api/products/<int:id>', methods=['PUT'])
def update_product(id):
    product = Product.query.get_or_404(id)
    data = request.json
    
    product.name = data.get('name', product.name)
    product.sku = data.get('sku', product.sku)
    product.description = data.get('description', product.description)
    product.price = data.get('price', product.price)
    product.cost = data.get('cost', product.cost)
    product.quantity = data.get('quantity', product.quantity)
    product.min_stock = data.get('min_stock', product.min_stock)
    product.category = data.get('category', product.category)
    
    db.session.commit()
    return jsonify(product.to_dict())

@app.route('/api/products/<int:id>', methods=['DELETE'])
def delete_product(id):
    product = Product.query.get_or_404(id)
    
    # Check if product has been sold
    if product.sales:
        return jsonify({
            'error': 'Cannot delete product that has been sold. Consider marking it as inactive instead.'
        }), 400
    
    db.session.delete(product)
    db.session.commit()
    return '', 204

# Sales endpoints
@app.route('/api/sales', methods=['GET'])
def get_sales():
    sales = Sale.query.order_by(Sale.created_at.desc()).all()
    return jsonify([s.to_dict() for s in sales])

@app.route('/api/sales/<int:id>', methods=['GET'])
def get_sale(id):
    sale = Sale.query.get_or_404(id)
    return jsonify(sale.to_dict(include_items=True))

@app.route('/api/sales', methods=['POST'])
def create_sale():
    data = request.json
    
    # Generate invoice number
    last_sale = Sale.query.order_by(Sale.id.desc()).first()
    invoice_num = f"INV-{(last_sale.id + 1):05d}" if last_sale else "INV-00001"
    
    # Calculate totals
    subtotal = sum(item['price'] * item['quantity'] for item in data['items'])
    discount = data.get('discount', 0)
    tax = data.get('tax', 0)
    total = subtotal - discount + tax
    
    # Create sale
    sale = Sale(
        invoice_number=invoice_num,
        customer_name=data.get('customer_name', ''),
        customer_email=data.get('customer_email', ''),
        total=total,
        tax=tax,
        discount=discount,
        payment_method=data.get('payment_method', 'cash'),
        status='completed'
    )
    db.session.add(sale)
    db.session.flush()
    
    # Create sale items and update inventory
    for item_data in data['items']:
        product = Product.query.get(item_data['product_id'])
        if not product:
            db.session.rollback()
            return jsonify({'error': f'Product {item_data["product_id"]} not found'}), 404
        
        if product.quantity < item_data['quantity']:
            db.session.rollback()
            return jsonify({'error': f'Insufficient stock for {product.name}'}), 400
        
        sale_item = SaleItem(
            sale_id=sale.id,
            product_id=product.id,
            quantity=item_data['quantity'],
            price=item_data['price'],
            subtotal=item_data['price'] * item_data['quantity']
        )
        db.session.add(sale_item)
        
        # Update product quantity
        product.quantity -= item_data['quantity']
    
    db.session.commit()
    return jsonify(sale.to_dict(include_items=True)), 201

@app.route('/api/sales/<int:id>/invoice', methods=['GET'])
def generate_invoice(id):
    sale = Sale.query.get_or_404(id)
    
    # Create PDF
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()
    
    # Title
    title = Paragraph(f"<b>INVOICE {sale.invoice_number}</b>", styles['Title'])
    elements.append(title)
    elements.append(Spacer(1, 0.3*inch))
    
    # Sale info
    info_data = [
        ['Date:', sale.created_at.strftime('%Y-%m-%d %H:%M')],
        ['Customer:', sale.customer_name or 'Walk-in Customer'],
        ['Payment:', sale.payment_method.title()],
    ]
    info_table = Table(info_data, colWidths=[1.5*inch, 4*inch])
    info_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Items table
    items_data = [['Item', 'Qty', 'Price', 'Subtotal']]
    for item in sale.items:
        items_data.append([
            item.product.name,
            str(item.quantity),
            f'${item.price:.2f}',
            f'${item.subtotal:.2f}'
        ])
    
    items_table = Table(items_data, colWidths=[3*inch, 1*inch, 1.5*inch, 1.5*inch])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Totals
    subtotal = sum(item.subtotal for item in sale.items)
    totals_data = [
        ['Subtotal:', f'${subtotal:.2f}'],
        ['Discount:', f'-${sale.discount:.2f}'],
        ['Tax:', f'${sale.tax:.2f}'],
        ['Total:', f'${sale.total:.2f}']
    ]
    totals_table = Table(totals_data, colWidths=[5*inch, 2*inch])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, -1), (-1, -1), 12),
        ('LINEABOVE', (0, -1), (-1, -1), 2, colors.black),
    ]))
    elements.append(totals_table)
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    
    return send_file(
        buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f'{sale.invoice_number}.pdf'
    )

# Dashboard stats
@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    total_products = Product.query.count()
    low_stock_count = Product.query.filter(Product.quantity <= Product.min_stock).count()
    total_sales = Sale.query.count()
    
    # Revenue calculation
    total_revenue = db.session.query(db.func.sum(Sale.total)).scalar() or 0
    
    # Recent sales
    recent_sales = Sale.query.order_by(Sale.created_at.desc()).limit(5).all()
    
    return jsonify({
        'total_products': total_products,
        'low_stock_count': low_stock_count,
        'total_sales': total_sales,
        'total_revenue': float(total_revenue),
        'recent_sales': [s.to_dict() for s in recent_sales]
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)