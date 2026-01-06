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
            'error': 'Cannot delete product that has been sold. Use the toggle to mark it as inactive instead.'
        }), 400
    
    db.session.delete(product)
    db.session.commit()
    return '', 204

# Toggle product active status
@app.route('/api/products/<int:id>/toggle-active', methods=['PUT'])
def toggle_product_active(id):
    product = Product.query.get_or_404(id)
    product.active = not product.active
    db.session.commit()
    return jsonify(product.to_dict())

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
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch, leftMargin=0.75*inch, rightMargin=0.75*inch)
    elements = []
    styles = getSampleStyleSheet()
    
    # Define custom colors to match the pink invoice
    from reportlab.lib.colors import HexColor
    burgundy_color = HexColor('#8B4789')  # Burgundy/maroon color from invoice
    
    # Company Details
    COMPANY_NAME = "C.V. JOINT MAC"
    TAGLINE = "Specialising in * Sales * Service * Repairs<br/>& Reconditioning to all make of C.V. Joints"
    ADDRESS_LINE1 = "Shop 10, Peters Road"
    ADDRESS_LINE2 = "Springfield Park"
    EMAIL = "cvjointmac@gmail.com"
    TEL = "(031) 577 6049"
    AFTER_HOURS = "082 931 1198"
    FAX = "086 2733 861"
    
    # Invoice header - INVOICE and Number on same line
    header_data = [[
        Paragraph("<b>INVOICE</b>", styles['Title']),
        Paragraph(f"<b>No.: {sale.invoice_number.replace('INV-', '')}</b>", styles['Title'])
    ]]
    header_table = Table(header_data, colWidths=[4*inch, 2.5*inch])
    header_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ('TEXTCOLOR', (0, 0), (-1, -1), burgundy_color),
        ('FONTSIZE', (0, 0), (-1, -1), 18),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 0.1*inch))
    
    # CV Joint graphic - simple text representation
    cv_joint_style = styles['Normal'].clone('CVJointStyle')
    cv_joint_style.alignment = 1  # Center
    cv_joint_style.fontSize = 14
    cv_joint_style.textColor = burgundy_color
    cv_joint_graphic = Paragraph("═══╬═══○═══╬═══○═══╬═══", cv_joint_style)
    elements.append(cv_joint_graphic)
    elements.append(Spacer(1, 0.15*inch))
    
    # Company Name - Centered
    company_style = styles['Heading1'].clone('CompanyStyle')
    company_style.alignment = 1  # Center
    company_style.fontSize = 24
    company_style.textColor = burgundy_color
    company_style.fontName = 'Helvetica-Bold'
    company_name = Paragraph(f"<b>{COMPANY_NAME}</b>", company_style)
    elements.append(company_name)
    elements.append(Spacer(1, 0.1*inch))
    
    # Tagline - Centered
    tagline_style = styles['Normal'].clone('TaglineStyle')
    tagline_style.alignment = 1  # Center
    tagline_style.fontSize = 9
    tagline_style.textColor = burgundy_color
    tagline_style.fontStyle = 'italic'
    tagline = Paragraph(TAGLINE, tagline_style)
    elements.append(tagline)
    elements.append(Spacer(1, 0.25*inch))
    
    # Address and Contact Info - Two columns
    contact_left = f"{ADDRESS_LINE1}<br/>{ADDRESS_LINE2}<br/>E-mail: {EMAIL}"
    contact_right = f"Tel.: {TEL}<br/>A/h: {AFTER_HOURS}<br/>Fax: {FAX}"
    
    contact_data = [[
        Paragraph(contact_left, styles['Normal']),
        Paragraph(contact_right, styles['Normal'])
    ]]
    contact_table = Table(contact_data, colWidths=[3.25*inch, 3.25*inch])
    contact_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ('TEXTCOLOR', (0, 0), (-1, -1), burgundy_color),
    ]))
    elements.append(contact_table)
    elements.append(Spacer(1, 0.25*inch))
    
    # Customer and Date section
    customer_date_data = [[
        Paragraph(f"M: {sale.customer_name or '_' * 50}", styles['Normal']),
        Paragraph(f"Date: {sale.created_at.strftime('%d/%m/%y')}", styles['Normal'])
    ]]
    customer_date_table = Table(customer_date_data, colWidths=[4*inch, 2.5*inch])
    customer_date_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ('LINEBELOW', (0, 0), (0, 0), 0.5, colors.black),
    ]))
    elements.append(customer_date_table)
    elements.append(Spacer(1, 0.05*inch))
    
    # KM field
    km_line = Paragraph(f"{'_' * 100} KM: {'_' * 30}", styles['Normal'])
    elements.append(km_line)
    elements.append(Spacer(1, 0.2*inch))
    
    # Items table
    items_data = [['Qty.', 'Description', 'Unit Price', 'Amount']]
    for item in sale.items:
        items_data.append([
            str(item.quantity),
            item.product.name,
            f'{item.price:.2f}',
            f'{item.subtotal:.2f}'
        ])
    
    # Add empty rows to match invoice style (at least 8-10 rows total)
    while len(items_data) < 12:
        items_data.append(['', '', '', ''])
    
    items_table = Table(items_data, colWidths=[0.75*inch, 3*inch, 1.25*inch, 1.5*inch])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), burgundy_color),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, burgundy_color),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 0.1*inch))
    
    # Guarantee section
    guarantee_style = styles['Normal'].clone('GuaranteeStyle')
    guarantee_style.fontSize = 8
    guarantee_style.textColor = burgundy_color
    guarantee_text = "..............MONTHS OR.................................KM GUARANTEE ON C.V. JOINTS"
    guarantee_para = Paragraph(guarantee_text, guarantee_style)
    elements.append(guarantee_para)
    elements.append(Spacer(1, 0.05*inch))
    
    # Conditions
    conditions_style = styles['Normal'].clone('ConditionsStyle')
    conditions_style.fontSize = 7
    conditions_style.leading = 9
    conditions_style.textColor = burgundy_color
    
    conditions_text = """
    <b>CONDITIONS:</b><br/>
    1. No guarantee on C.V. Joint, if C.V. Boot is tampered with, broken or burst.<br/>
    2. No Guarantee on C.V. Joint if there is any defects relating to C.V. Joint.<br/>
    3. We are not liable for any cost on C.V. Joints taken elsewhere during the guarantee period.<br/>
    4. Goods remain the property of the seller until paid for in full.<br/>
    5. Conditions of guarantee understood and goods received in good working order.<br/>
    6. We are not liable for any towing costs.
    """
    conditions = Paragraph(conditions_text, conditions_style)
    elements.append(conditions)
    elements.append(Spacer(1, 0.15*inch))
    
    # Total section - right aligned
    subtotal = sum(item.subtotal for item in sale.items)
    total_data = [
        ['', '', '', f'R {subtotal:.2f}'],
        ['', '', 'TOTAL R', f'{sale.total:.2f}']
    ]
    total_table = Table(total_data, colWidths=[0.75*inch, 3*inch, 1.25*inch, 1.5*inch])
    total_table.setStyle(TableStyle([
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (2, 1), (-1, 1), 'Helvetica-Bold'),
        ('FONTSIZE', (2, 1), (-1, 1), 14),
        ('LINEABOVE', (3, 0), (3, 0), 1, colors.black),
        ('LINEABOVE', (3, 1), (3, 1), 2, colors.black),
        ('LINEBELOW', (3, 1), (3, 1), 2, colors.black),
    ]))
    elements.append(total_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Signature line
    sig_style = styles['Normal'].clone('SigStyle')
    sig_style.fontSize = 9
    sig_line = Paragraph(f"Signature: {'_' * 50}", sig_style)
    elements.append(sig_line)
    
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