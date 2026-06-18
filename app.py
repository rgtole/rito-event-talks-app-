from flask import Flask, render_template, jsonify
import requests
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
import re
import os

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def fetch_and_parse_feed():
    try:
        response = requests.get(FEED_URL, timeout=15)
        if response.status_code != 200:
            return None, f"Failed to fetch feed: HTTP {response.status_code}"
    except Exception as e:
        return None, f"Error requesting feed: {str(e)}"

    try:
        # XML namespaces for Atom feed
        namespaces = {'atom': 'http://www.w3.org/2005/Atom'}
        root = ET.fromstring(response.content)
        entries = []
        
        for entry in root.findall('atom:entry', namespaces):
            title = entry.find('atom:title', namespaces)
            date_str = title.text.strip() if title is not None else 'Unknown Date'
            
            updated = entry.find('atom:updated', namespaces)
            updated_str = updated.text.strip() if updated is not None else ''
            
            link_elem = entry.find('atom:link[@rel="alternate"]', namespaces)
            link = link_elem.attrib.get('href', '') if link_elem is not None else ''
            
            content_elem = entry.find('atom:content', namespaces)
            content_html = content_elem.text if content_elem is not None else ''
            
            # Use BeautifulSoup to separate updates by <h3> headings
            soup = BeautifulSoup(content_html, 'html.parser')
            
            current_type = "Update"
            current_html_parts = []
            items = []
            
            for child in soup.children:
                if child.name == 'h3':
                    # Save the previous block before moving to the next
                    if current_html_parts:
                        items.append({
                            'type': current_type,
                            'content': "".join(str(c) for c in current_html_parts).strip()
                        })
                        current_html_parts = []
                    current_type = child.get_text().strip()
                elif child.name is not None:
                    current_html_parts.append(child)
            
            # Save the final block
            if current_html_parts:
                items.append({
                    'type': current_type,
                    'content': "".join(str(c) for c in current_html_parts).strip()
                })
            
            # Fallback if no <h3> tags were found
            if not items and content_html.strip():
                items.append({
                    'type': 'Update',
                    'content': content_html.strip()
                })
                
            for item in items:
                # Create plain text description for tweeting and previewing
                item_soup = BeautifulSoup(item['content'], 'html.parser')
                text_desc = item_soup.get_text().strip()
                # Clean up whitespace and newlines
                text_desc = re.sub(r'\s+', ' ', text_desc)
                
                entries.append({
                    'date': date_str,
                    'updated': updated_str,
                    'link': link,
                    'type': item['type'],
                    'html': item['content'],
                    'text': text_desc
                })
                
        return entries, None
    except Exception as e:
        return None, f"Failed to parse feed XML: {str(e)}"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    entries, error = fetch_and_parse_feed()
    if error:
        return jsonify({'status': 'error', 'message': error}), 500
    return jsonify({'status': 'success', 'data': entries})

if __name__ == '__main__':
    # Run the server on port 5000
    app.run(host='127.0.0.1', port=5000, debug=True)
