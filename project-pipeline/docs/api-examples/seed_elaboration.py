#!/usr/bin/env python3
"""
=============================================================================
Seed Elaboration API - Python Examples
=============================================================================
This module demonstrates how to interact with the Seed Elaboration API
using Python with the requests library.

Prerequisites:
- Python 3.8+
- requests library: pip install requests

Usage:
    from seed_elaboration import SeedElaborationClient

    client = SeedElaborationClient('your-jwt-token')
    client.run_full_elaboration_flow('seed-uuid')

CLI Usage:
    export JWT_TOKEN='your-token-here'
    export SEED_ID='seed-uuid-here'
    python seed_elaboration.py
=============================================================================
"""

import os
import sys
from typing import Dict, List, Optional, Any
import requests
import json


class SeedElaborationClient:
    """
    Client for interacting with the Seed Elaboration API.

    Attributes:
        jwt_token (str): JWT authentication token
        base_url (str): API base URL
    """

    def __init__(self, jwt_token: str, base_url: str = 'http://localhost:3000'):
        """
        Initialize the Seed Elaboration API client.

        Args:
            jwt_token: JWT authentication token
            base_url: API base URL (default: http://localhost:3000)
        """
        self.jwt_token = jwt_token
        self.base_url = base_url.rstrip('/')
        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {jwt_token}',
        }

    def start_session(self, seed_id: str) -> Dict[str, Any]:
        """
        Start a new elaboration session.

        Args:
            seed_id: Seed UUID

        Returns:
            StartSessionResponse containing sessionId, question, completeness, etc.

        Raises:
            requests.HTTPError: If the API request fails
        """
        url = f'{self.base_url}/seeds/{seed_id}/elaborate/start'
        response = requests.post(url, headers=self.headers)
        response.raise_for_status()
        return response.json()

    def submit_answer(self, seed_id: str, session_id: str, answer: str) -> Dict[str, Any]:
        """
        Submit an answer to the current question.

        Args:
            seed_id: Seed UUID
            session_id: Session UUID
            answer: User's answer to the current question

        Returns:
            ProcessAnswerResponse containing nextQuestion, completeness, metadata, etc.

        Raises:
            requests.HTTPError: If the API request fails
        """
        url = f'{self.base_url}/seeds/{seed_id}/elaborate/answer'
        payload = {
            'sessionId': session_id,
            'answer': answer,
        }
        response = requests.post(url, headers=self.headers, json=payload)
        response.raise_for_status()
        return response.json()

    def get_status(self, seed_id: str) -> Dict[str, Any]:
        """
        Get elaboration status and progress.

        Args:
            seed_id: Seed UUID

        Returns:
            ElaborationStatusResponse containing completeness, metadata, missingFields

        Raises:
            requests.HTTPError: If the API request fails
        """
        url = f'{self.base_url}/seeds/{seed_id}/elaborate/status'
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()

    def run_full_elaboration_flow(self, seed_id: str) -> None:
        """
        Run a complete elaboration flow with example answers.

        Args:
            seed_id: Seed UUID
        """
        print('🚀 Starting seed elaboration flow...\n')

        # Start session
        print('📝 Step 1: Starting session...')
        start_response = self.start_session(seed_id)
        session_id = start_response['sessionId']
        print(f'✅ Session started: {session_id}')
        print(f'❓ Question 1: {start_response["question"]}')
        print(f'📊 Completeness: {start_response["completeness"]}%\n')

        # Example answers
        example_answers = [
            '30 young people aged 18-25 from Turkey, Spain, and Germany',
            'Barcelona, Spain, at the Youth Hostel Barcelona',
            '7 days, from July 15 to July 21, 2024',
            '€15,000 total budget, approximately €500 per participant',
            'Cultural workshops, team building activities, and local excursions',
            'Focus on inclusion and environmental sustainability',
            'Travel insurance required, no visas needed for EU participants',
        ]

        # Submit answers
        question_number = 2
        for answer in example_answers:
            print(f'📝 Step {question_number}: Submitting answer...')
            print(f'💬 Answer: "{answer}"')

            answer_response = self.submit_answer(seed_id, session_id, answer)

            print(f'✅ Answer processed')
            print(f'📊 Completeness: {answer_response["completeness"]}%')

            if 'extractedMetadata' in answer_response and answer_response['extractedMetadata']:
                print(f'📦 Extracted metadata:')
                print(json.dumps(answer_response['extractedMetadata'], indent=2))

            if answer_response.get('complete', False):
                print('🎉 Elaboration complete!\n')
                break

            if answer_response.get('nextQuestion'):
                print(f'❓ Next question: {answer_response["nextQuestion"]}')
                if answer_response.get('suggestions'):
                    print(f'💡 Suggestions: {", ".join(answer_response["suggestions"])}')

            print()
            question_number += 1

        # Get final status
        print('📊 Step Final: Getting final status...')
        status = self.get_status(seed_id)
        print(f'✅ Final completeness: {status["completeness"]}%')
        print(f'📦 Final metadata:')
        print(json.dumps(status['metadata'], indent=2))

        if status['missingFields']:
            print(f'⚠️  Missing fields: {", ".join(status["missingFields"])}')
        else:
            print('✅ All required information collected!')


# =============================================================================
# Usage Examples
# =============================================================================

def example1_basic_usage():
    """Example 1: Basic usage - Start session and submit one answer"""
    client = SeedElaborationClient('your-jwt-token-here')
    seed_id = '550e8400-e29b-41d4-a716-446655440000'

    try:
        # Start session
        start_response = client.start_session(seed_id)
        print('First question:', start_response['question'])

        # Submit answer
        answer_response = client.submit_answer(
            seed_id,
            start_response['sessionId'],
            '30 young people aged 18-25 from Turkey, Spain, and Germany'
        )

        print('Next question:', answer_response.get('nextQuestion'))
        print('Completeness:', str(answer_response['completeness']) + '%')
    except requests.HTTPError as e:
        print(f'Error: {e}')
        print(f'Response: {e.response.text}')


def example2_check_status():
    """Example 2: Check status before continuing"""
    client = SeedElaborationClient('your-jwt-token-here')
    seed_id = '550e8400-e29b-41d4-a716-446655440000'

    try:
        # Check current status
        status = client.get_status(seed_id)
        print('Current completeness:', str(status['completeness']) + '%')
        print('Missing fields:', status['missingFields'])

        # Resume if not complete
        if status['completeness'] < 100:
            start_response = client.start_session(seed_id)
            print('Resuming session:', start_response['sessionId'])
            print('Current question:', start_response['question'])
    except requests.HTTPError as e:
        print(f'Error: {e}')
        print(f'Response: {e.response.text}')


def example3_interactive_flow():
    """Example 3: Full elaboration flow with interactive prompts"""
    client = SeedElaborationClient('your-jwt-token-here')
    seed_id = '550e8400-e29b-41d4-a716-446655440000'

    try:
        start_response = client.start_session(seed_id)
        session_id = start_response['sessionId']
        current_question = start_response['question']
        complete = False

        print(f'\n📝 Elaboration started (Session: {session_id})\n')

        while not complete:
            print(f'❓ {current_question}\n')
            answer = input('Your answer: ')

            response = client.submit_answer(seed_id, session_id, answer)

            print(f'\n📊 Completeness: {response["completeness"]}%')

            if response.get('extractedMetadata'):
                print('📦 Extracted:', json.dumps(response['extractedMetadata'], indent=2))

            if response.get('complete', False):
                print('\n🎉 Elaboration complete!\n')
                complete = True
            else:
                current_question = response.get('nextQuestion', '')
                if response.get('suggestions'):
                    print('💡 Suggestions:', ', '.join(response['suggestions']))
                print()
    except requests.HTTPError as e:
        print(f'Error: {e}')
        print(f'Response: {e.response.text}')
    except KeyboardInterrupt:
        print('\n\nElaboration interrupted by user.')


def example4_error_handling():
    """Example 4: Error handling"""
    client = SeedElaborationClient('your-jwt-token-here')
    seed_id = '550e8400-e29b-41d4-a716-446655440000'

    try:
        start_response = client.start_session(seed_id)

        # Try to submit with invalid session ID
        try:
            client.submit_answer(seed_id, 'invalid-session-id', 'Some answer')
        except requests.HTTPError as e:
            print('Expected error for invalid session:', e.response.json()['message'])

        # Submit with correct session ID
        answer_response = client.submit_answer(
            seed_id,
            start_response['sessionId'],
            '30 young people'
        )

        print('Answer submitted successfully')
    except requests.HTTPError as e:
        print(f'Unexpected error: {e}')
        print(f'Response: {e.response.text}')


def example5_batch_processing():
    """Example 5: Process multiple seeds in batch"""
    client = SeedElaborationClient('your-jwt-token-here')
    seed_ids = [
        '550e8400-e29b-41d4-a716-446655440000',
        '550e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440002',
    ]

    for seed_id in seed_ids:
        try:
            print(f'\n📦 Processing seed: {seed_id}')
            status = client.get_status(seed_id)
            print(f'  Completeness: {status["completeness"]}%')

            if status['completeness'] < 100:
                print(f'  Missing fields: {", ".join(status["missingFields"])}')
        except requests.HTTPError as e:
            print(f'  Error: {e.response.json()["message"]}')


# =============================================================================
# CLI Interface
# =============================================================================

def main():
    """Main CLI entry point"""
    jwt_token = os.environ.get('JWT_TOKEN')
    seed_id = os.environ.get('SEED_ID', '550e8400-e29b-41d4-a716-446655440000')

    if not jwt_token:
        print('❌ Error: JWT_TOKEN environment variable is required')
        print('Usage: JWT_TOKEN=your-token SEED_ID=seed-uuid python seed_elaboration.py')
        sys.exit(1)

    client = SeedElaborationClient(jwt_token)

    try:
        client.run_full_elaboration_flow(seed_id)
    except requests.HTTPError as e:
        print(f'\n❌ API Error: {e}')
        try:
            error_detail = e.response.json()
            print(f'Message: {error_detail.get("message", "Unknown error")}')
        except:
            print(f'Response: {e.response.text}')
        sys.exit(1)
    except KeyboardInterrupt:
        print('\n\nProcess interrupted by user.')
        sys.exit(0)


if __name__ == '__main__':
    main()
