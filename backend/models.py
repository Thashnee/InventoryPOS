from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Product(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    sku = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    cost = db.Column(db.Numeric(10, 2), default=0)
    quantity = db.Column(db.Integer, default=0)
    min_stock = db.Column(db.Integer, default=5)
    category = db.Column(db.String(100))
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    sales = db.relationship('SaleItem', backref='product', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'sku': self.sku,
            'description': self.description,
            'price': float(self.price),
            'cost': float(self.cost),
            'quantity': self.quantity,
            'min_stock': self.min_stock,
            'category': self.category,
            'active': self.active,
            'low_stock': self.quantity <= self.min_stock,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class Sale(db.Model):
    __tablename__ = 'sales'
    
    id = db.Column(db.Integer, primary_key=True)
    invoice_number = db.Column(db.String(50), unique=True, nullable=False)
    customer_name = db.Column(db.String(200))
    customer_email = db.Column(db.String(200))
    total = db.Column(db.Numeric(10, 2), nullable=False)
    tax = db.Column(db.Numeric(10, 2), default=0)
    discount = db.Column(db.Numeric(10, 2), default=0)
    payment_method = db.Column(db.String(50))
    status = db.Column(db.String(50), default='completed')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    items = db.relationship('SaleItem', backref='sale', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self, include_items=False):
        data = {
            'id': self.id,
            'invoice_number': self.invoice_number,
            'customer_name': self.customer_name,
            'customer_email': self.customer_email,
            'total': float(self.total),
            'tax': float(self.tax),
            'discount': float(self.discount),
            'payment_method': self.payment_method,
            'status': self.status,
            'created_at': self.created_at.isoformat()
        }
        if include_items:
            data['items'] = [item.to_dict() for item in self.items]
        return data

class SaleItem(db.Model):
    __tablename__ = 'sale_items'
    
    id = db.Column(db.Integer, primary_key=True)
    sale_id = db.Column(db.Integer, db.ForeignKey('sales.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    subtotal = db.Column(db.Numeric(10, 2), nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else None,
            'quantity': self.quantity,
            'price': float(self.price),
            'subtotal': float(self.subtotal)
        }