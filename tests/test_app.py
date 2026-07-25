import os
import pytest
from app import app, init_db, get_db

@pytest.fixture
def client():
    # Configure app for testing
    app.config['TESTING'] = True
    app.config['WTF_CSRF_ENABLED'] = False
    
    # Initialize a test database in memory or a temp file
    # We will just test the routes without breaking the local database
    with app.test_client() as client:
        with app.app_context():
            init_db()
        yield client

def test_index_route(client):
    """Test that the home page loads successfully"""
    response = client.get('/')
    assert response.status_code == 200

def test_register_validation(client):
    """Test registration with missing fields"""
    response = client.post('/api/register', json={
        'name': 'Test User',
        # missing email
        'password': 'password123'
    })
    assert response.status_code == 400
    assert b'All fields are required' in response.data

def test_login_missing_fields(client):
    """Test login with missing fields"""
    response = client.post('/api/login', json={
        'email': 'test@example.com'
        # missing password
    })
    assert response.status_code == 400
    assert b'Email and password are required' in response.data

def test_me_unauthorized(client):
    """Test accessing /api/me without being logged in"""
    response = client.get('/api/me')
    assert response.status_code == 401
    assert b'Not logged in' in response.data
