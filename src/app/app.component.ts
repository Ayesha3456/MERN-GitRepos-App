import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { PDFDocument, rgb } from 'pdf-lib';
import { CommonModule, NgIf } from '@angular/common';

interface GitHubProfile {
  name?: string;
  login: string;
  public_repos: number;
  followers: number;
  following: number;
  repos?: any[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [CommonModule, ReactiveFormsModule, NgIf, HttpClientModule]
})
export class AppComponent {
  reportGenerated: boolean = false;
  repositories: any[] = [];

  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  githubForm = this.fb.group({
    githubUrl: ['']
  });

  async onSubmit() {
    const githubUrl = this.githubForm.get('githubUrl')?.value;

    if (githubUrl) {
      try {
        const profileData = await this.fetchGithubProfile(githubUrl);
        if (profileData) {
          this.repositories = profileData.repos || [];
          await this.generatePDF(profileData);
          this.reportGenerated = true;
        } else {
          console.error('Profile data is undefined.');
          this.reportGenerated = false;
        }
      } catch (error) {
        console.error('Error generating report:', error);
        this.reportGenerated = false;
      }
    }
  }

  async fetchGithubProfile(url: string): Promise<GitHubProfile | undefined> {
    const username = url.split('/').pop();
    if (!username) {
      console.error('Username extraction failed.');
      return undefined;
    }
    try {
      const profileResponse = await this.http.get<GitHubProfile>(`https://api.github.com/users/${username}`).toPromise();
      if (!profileResponse || !profileResponse.login) {
        throw new Error('GitHub profile login is missing.');
      }

      const reposResponse = await this.http.get<any[]>(`https://api.github.com/users/${username}/repos`).toPromise();
      if (!Array.isArray(reposResponse)) {
        console.error('Invalid repositories response format.');
        return undefined;
      }

      return {
        ...profileResponse,
        repos: reposResponse
      } as GitHubProfile;
    } catch (error) {
      console.error('Error fetching GitHub profile:', error);
      return undefined;
    }
  }

  async generatePDF(profileData: GitHubProfile) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const { width, height } = page.getSize();
  
    // Define initial y-position and line spacing
    let yPosition = height - 50;
    const lineSpacing = 24;
    const titleSpacing = 30;

    // Title
    page.drawText('GitHub Profile Report', {
      x: 50,
      y: yPosition,
      size: 24,
      color: rgb(0, 0.53, 0.71),
      lineHeight: titleSpacing,
    });
    
    // Adjust y-position after title
    yPosition -= titleSpacing;

    // Profile information
    page.drawText(`Name: ${profileData.name || 'N/A'}`, {
      x: 50,
      y: yPosition,
      size: 18,
      lineHeight: lineSpacing,
    });
    yPosition -= lineSpacing;
    page.drawText(`Username: ${profileData.login}`, {
      x: 50,
      y: yPosition,
      size: 18,
      lineHeight: lineSpacing,
    });
    yPosition -= lineSpacing;
    page.drawText(`Public Repos: ${profileData.public_repos}`, {
      x: 50,
      y: yPosition,
      size: 18,
      lineHeight: lineSpacing,
    });
    yPosition -= lineSpacing;
    page.drawText(`Followers: ${profileData.followers}`, {
      x: 50,
      y: yPosition,
      size: 18,
      lineHeight: lineSpacing,
    });
    yPosition -= lineSpacing;
    page.drawText(`Following: ${profileData.following}`, {
      x: 50,
      y: yPosition,
      size: 18,
      lineHeight: lineSpacing,
    });

    // Add a section for Tech Stack Evaluation
    yPosition -= 30;
    page.drawText('Tech Stack Evaluation:', {
      x: 50,
      y: yPosition,
      size: 20,
      lineHeight: lineSpacing,
      color: rgb(0.2, 0.2, 0.2)
    });
    yPosition -= lineSpacing;
    const techStackText = this.evaluateTechStack(profileData.repos);
    page.drawText(techStackText, {
      x: 50,
      y: yPosition,
      size: 18,
      lineHeight: lineSpacing,
      maxWidth: width - 100,
    });

    // Adjust y-position after Tech Stack Evaluation
    yPosition -= (lineSpacing * (techStackText.split('\n').length + 1)) + 30;

    // Add a section for Experience Evaluation
    page.drawText('Experience Evaluation:', {
      x: 50,
      y: yPosition,
      size: 20,
      lineHeight: lineSpacing,
      color: rgb(0.2, 0.2, 0.2)
    });
    yPosition -= lineSpacing;
    const experienceText = this.evaluateExperience(profileData.repos);
    page.drawText(experienceText, {
      x: 50,
      y: yPosition,
      size: 18,
      lineHeight: lineSpacing,
      maxWidth: width - 100,
    });

    // Adjust y-position after Experience Evaluation
    yPosition -= (lineSpacing * (experienceText.split('\n').length + 1)) + 30;

    // Add a section for Repository Impact
    page.drawText('Repository Impact:', {
      x: 50,
      y: yPosition,
      size: 20,
      lineHeight: lineSpacing,
      color: rgb(0.2, 0.2, 0.2)
    });
    yPosition -= lineSpacing;
    const repoImpactText = this.evaluateRepoImpact(profileData.repos);
    page.drawText(repoImpactText, {
      x: 50,
      y: yPosition,
      size: 18,
      lineHeight: lineSpacing,
      maxWidth: width - 100,
    });

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'GitHub_Profile_Report.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  evaluateTechStack(repos?: any[]): string {
    if (!repos || !Array.isArray(repos)) return 'No data available.';

    const languageCount: { [key: string]: number } = {};

    repos.forEach(repo => {
      const language = repo.language || 'Unknown';
      if (language) {
        languageCount[language] = (languageCount[language] || 0) + 1;
      }
    });

    const techStack = Object.entries(languageCount)
      .map(([language, count]) => `${language}: ${count} repo(s)`)
      .join('\n');

    return techStack || 'No tech stack information available.';
  }

  evaluateExperience(repos?: any[]): string {
    if (!repos || !Array.isArray(repos)) return 'No data available.';

    const repoCount = repos.length;
    return `Number of repositories: ${repoCount}`;
  }

  evaluateRepoImpact(repos?: any[]): string {
    if (!repos || !Array.isArray(repos)) return 'No data available.';

    const repoImpact = repos.map(repo => {
      return `${repo.name}: ${repo.stargazers_count} stars, ${repo.forks_count} forks`;
    }).join('\n');

    return repoImpact || 'No repository impact information available.';
  }

  clearInput() {
    this.githubForm.get('githubUrl')?.setValue('');
  }
}
