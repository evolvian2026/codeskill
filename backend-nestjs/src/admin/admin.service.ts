import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { UserDocument, User } from '../database/schemas/user.schema';
import {
  ProblemMetadataDocument,
  ProblemMetadata,
} from '../database/schemas/problem-metadata.schema';
import {
  ProblemStatementDocument,
  ProblemStatement,
} from '../database/schemas/problem-statement.schema';
import {
  ProblemConfigDocument,
  ProblemConfig,
} from '../database/schemas/problem-config.schema';
import {
  ProblemTestCaseDocument,
  ProblemTestCase,
} from '../database/schemas/problem-testcase.schema';
import { ContestDocument, Contest } from '../database/schemas/contest.schema';
import { CompanyDocument, Company } from '../database/schemas/company.schema';
import {
  UniversityDocument,
  University,
} from '../database/schemas/university.schema';
import {
  SubmissionDocument,
  Submission,
} from '../database/schemas/submission.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(ProblemMetadata.name)
    private problemModel: Model<ProblemMetadataDocument>,
    @InjectModel(ProblemStatement.name)
    private statementModel: Model<ProblemStatementDocument>,
    @InjectModel(ProblemConfig.name)
    private configModel: Model<ProblemConfigDocument>,
    @InjectModel(ProblemTestCase.name)
    private testCaseModel: Model<ProblemTestCaseDocument>,
    @InjectModel(Contest.name) private contestModel: Model<ContestDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(University.name)
    private universityModel: Model<UniversityDocument>,
    @InjectModel(Submission.name)
    private submissionModel: Model<SubmissionDocument>,
  ) {}

  async getDashboardStats() {
    const [
      totalUsers,
      totalProblems,
      totalContests,
      totalSubmissions,
      recentUsers,
      recentSubmissions,
    ] = await Promise.all([
      this.userModel.countDocuments(),
      this.problemModel.countDocuments(),
      this.contestModel.countDocuments(),
      this.submissionModel.countDocuments(),
      this.userModel
        .find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email createdAt authProvider')
        .lean(),
      this.submissionModel
        .find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name')
        .lean(),
    ]);

    return {
      stats: { totalUsers, totalProblems, totalContests, totalSubmissions },
      recentActivity: { users: recentUsers, submissions: recentSubmissions },
    };
  }

  // Common user management for admin
  async getUsers(page = 1, limit = 50, search = '', adminsOnly = false) {
    const filter: any = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (adminsOnly) {
      filter.isAdmin = true;
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-password')
        .lean(),
      this.userModel.countDocuments(filter),
    ]);

    return { success: true, users, total, page, pages: Math.ceil(total / limit) };
  }

  async updateUserRole(id: string, roleData: any) {
    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: roleData }, { new: true })
      .select('-password');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getReport(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('-password')
      .lean();
    if (!user) throw new NotFoundException('User not found');

    const submissions = await this.submissionModel
      .find({ user: userId })
      .sort({ createdAt: -1 })
      .lean();

    const stats = {
      totalSubmissions: submissions.length,
      accepted: submissions.filter((s) => s.status === 'Accepted').length,
    };

    return {
      report: {
        user,
        stats,
        recentSubmissions: submissions.slice(0, 10),
      },
    };
  }

  // --- Contests ---
  async getContests(page = 1, limit = 20, search = '') {
    const filter = search ? { title: { $regex: search, $options: 'i' } } : {};
    const skip = (page - 1) * limit;

    const [contests, total] = await Promise.all([
      this.contestModel.find(filter).skip(skip).limit(limit).lean(),
      this.contestModel.countDocuments(filter),
    ]);
    return { contests, total, page, pages: Math.ceil(total / limit) };
  }

  async getContestById(id: string) {
    const contest = await this.contestModel.findById(id).lean();
    if (!contest) throw new NotFoundException('Contest not found');
    return contest;
  }

  async deleteContest(id: string) {
    const contest = await this.contestModel.findByIdAndDelete(id);
    if (!contest) throw new NotFoundException('Contest not found');
    return { success: true, message: 'Contest deleted' };
  }

  // --- Problems ---
  async getProblems(page = 1, limit = 20, search = '') {
    const filter = search ? { title: { $regex: search, $options: 'i' } } : {};
    const skip = (page - 1) * limit;

    const [problems, total] = await Promise.all([
      this.problemModel.find(filter).skip(skip).limit(limit).lean(),
      this.problemModel.countDocuments(filter),
    ]);
    return { problems, total, page, pages: Math.ceil(total / limit) };
  }

  async getProblemById(id: string) {
    const problem = await this.problemModel
      .findById(id)
      .populate('statement')
      .populate('config')
      .populate('testCases')
      .lean();
    if (!problem) throw new NotFoundException('Problem not found');
    return problem;
  }

  async deleteProblem(id: string) {
    const problem = await this.problemModel.findByIdAndDelete(id);
    if (!problem) throw new NotFoundException('Problem not found');
    return { success: true, message: 'Problem deleted' };
  }

  async createProblem(payload: any, userId?: string) {
    const {
      metadata,
      languages,
      execution,
      statement,
      sampleExamples,
      starterCode,
      referenceSolution,
      testCases,
      customChecker,
      publishing
    } = payload;

    const newProblem = new this.problemModel({
      ...metadata,
      visibility: publishing?.visibility || 'Draft',
      author: userId || null,
    });
    
    const newStatement = new this.statementModel({
      metadataId: newProblem._id,
      ...statement,
      samples: sampleExamples || [],
    });

    const newConfig = new this.configModel({
      metadataId: newProblem._id,
      supportedLanguages: languages || [],
      timeLimit: execution?.timeLimit || 2000,
      memoryLimit: execution?.memoryLimit || 256,
      cpuLimit: execution?.cpuLimit || 1,
      starterCode: starterCode || {},
      referenceSolution: referenceSolution || {},
      hasCustomChecker: customChecker?.hasCustomChecker || false,
      customCheckerCode: customChecker?.customCheckerCode || {},
    });

    const newTestCase = new this.testCaseModel({
      metadataId: newProblem._id,
      cases: testCases?.cases || [],
    });

    newProblem.statement = newStatement._id;
    newProblem.config = newConfig._id;
    newProblem.testCases = newTestCase._id;

    await Promise.all([
      newProblem.save(),
      newStatement.save(),
      newConfig.save(),
      newTestCase.save(),
    ]);

    return { success: true, problem: newProblem };
  }

  async updateProblem(id: string, payload: any) {
    const {
      metadata,
      languages,
      execution,
      statement,
      sampleExamples,
      starterCode,
      referenceSolution,
      testCases,
      customChecker,
      publishing
    } = payload;

    const problem = await this.problemModel.findById(id);
    if (!problem) throw new NotFoundException('Problem not found');

    if (metadata) {
      Object.assign(problem, metadata);
    }
    if (publishing?.visibility) {
      problem.visibility = publishing.visibility;
    }
    await problem.save();

    if (statement || sampleExamples) {
      const stmt = await this.statementModel.findOneAndUpdate(
        { metadataId: id },
        { $set: { ...statement, samples: sampleExamples || [] } },
        { upsert: true, new: true }
      );
      problem.statement = stmt._id;
    }

    const configUpdate: any = {};
    if (languages) configUpdate.supportedLanguages = languages;
    if (execution?.timeLimit) configUpdate.timeLimit = execution.timeLimit;
    if (execution?.memoryLimit) configUpdate.memoryLimit = execution.memoryLimit;
    if (execution?.cpuLimit) configUpdate.cpuLimit = execution.cpuLimit;
    if (starterCode) configUpdate.starterCode = starterCode;
    if (referenceSolution) configUpdate.referenceSolution = referenceSolution;
    if (customChecker?.hasCustomChecker !== undefined) configUpdate.hasCustomChecker = customChecker.hasCustomChecker;
    if (customChecker?.customCheckerCode) configUpdate.customCheckerCode = customChecker.customCheckerCode;

    const conf = await this.configModel.findOneAndUpdate(
      { metadataId: id },
      { $set: configUpdate },
      { upsert: true, new: true }
    );
    problem.config = conf._id;

    if (testCases?.cases) {
      const tc = await this.testCaseModel.findOneAndUpdate(
        { metadataId: id },
        { $set: { cases: testCases.cases } },
        { upsert: true, new: true }
      );
      problem.testCases = tc._id;
    }

    await problem.save();

    return { success: true, problem };
  }

  // --- Companies ---
  async getCompanies(page = 1, limit = 20, search = '') {
    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { domain: { $regex: search, $options: 'i' } },
          ],
        }
      : {};
    const skip = (page - 1) * limit;

    const [companies, total] = await Promise.all([
      this.companyModel.find(filter).skip(skip).limit(limit).lean(),
      this.companyModel.countDocuments(filter),
    ]);
    return { companies, total, page, pages: Math.ceil(total / limit) };
  }

  async toggleCompanyVerification(id: string) {
    const company = await this.companyModel.findById(id);
    if (!company) throw new NotFoundException('Company not found');
    
    company.isVerified = !company.isVerified;
    await company.save();
    return { success: true, isVerified: company.isVerified };
  }

  async deleteCompany(id: string) {
    const company = await this.companyModel.findByIdAndDelete(id);
    if (!company) throw new NotFoundException('Company not found');
    return { success: true, message: 'Company deleted' };
  }

  // --- Universities ---
  async getUniversities(page = 1, limit = 20, search = '') {
    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { domain: { $regex: search, $options: 'i' } },
          ],
        }
      : {};
    const skip = (page - 1) * limit;

    const [universities, total] = await Promise.all([
      this.universityModel.find(filter).skip(skip).limit(limit).lean(),
      this.universityModel.countDocuments(filter),
    ]);
    return { universities, total, page, pages: Math.ceil(total / limit) };
  }

  async toggleUniversityVerification(id: string) {
    const university = await this.universityModel.findById(id);
    if (!university) throw new NotFoundException('University not found');
    
    university.isVerified = !university.isVerified;
    await university.save();
    return { success: true, isVerified: university.isVerified };
  }

  async deleteUniversity(id: string) {
    const university = await this.universityModel.findByIdAndDelete(id);
    if (!university) throw new NotFoundException('University not found');
    return { success: true, message: 'University deleted' };
  }
}
