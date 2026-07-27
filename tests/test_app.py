import os
import pytest
from app import app, init_db, get_db

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['WTF_CSRF_ENABLED'] = False

    with app.test_client() as client:
        with app.app_context():
            init_db()
        yield client

def test_index_route(client):
    response = client.get('/')
    assert response.status_code == 200

def test_register_validation(client):
    response = client.post('/api/register', json={
        'name': 'Test User',
        'password': 'password123'
    })
    assert response.status_code == 400
    assert b'All fields are required' in response.data

def test_login_missing_fields(client):
    response = client.post('/api/login', json={
        'email': 'test@example.com'
    })
    assert response.status_code == 400
    assert b'Email and password are required' in response.data

def test_me_unauthorized(client):
    response = client.get('/api/me')
    assert response.status_code == 401
    assert b'Not logged in' in response.data
