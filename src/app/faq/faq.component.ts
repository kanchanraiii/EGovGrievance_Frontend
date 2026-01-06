import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

type FaqItem = { question: string; answer: string };

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.css']
})
export class FaqComponent {
  faqs: FaqItem[] = [
    {
      question: 'How do I lodge a grievance?',
      answer: 'Go to Dashboard > Lodge a grievance, choose a department, category, and submit details.'
    },
    {
      question: 'Can I track my grievance status?',
      answer: 'Yes. In My grievances you can view current status, details, and rate once resolved.'
    },
    {
      question: 'What if I cannot find my department?',
      answer: 'Check the Departments directory or try again later—new departments are added regularly.'
    },
    {
      question: 'Who can see my submission?',
      answer: 'Only authorized staff assigned to your case and oversight roles per platform policy.'
    }
  ];

  trackFaq(index: number, item: FaqItem) {
    return item.question + index;
  }
}
