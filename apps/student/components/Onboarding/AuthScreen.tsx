import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Phone,
  School,
  ShieldCheck,
  Sparkles,
  Timer,
  User
} from 'lucide-react';
import { InteractiveLumi } from '../LumiSpace/InteractiveLumi';

interface AuthScreenProps {
  onLogin: () => void;
}

type Mode = 'student' | 'phone';
type AuthView = 'login' | 'register';
type PasswordFlow = 'reset' | 'change' | null;
type AuthSubView = 'login' | 'reset' | 'change';

const MOCK_STUDENTS = [
  { student_id: '2024001', password: '123456', name: '李雷', grade: '六年级', school_id: 's1' },
  { student_id: '2024002', password: '654321', name: '韩梅梅', grade: '七年级', school_id: 's2' }
];

const MOCK_SCHOOLS = [
  { id: 's1', name: '朝阳第一小学', city: '北京', district: '朝阳' },
  { id: 's2', name: '育才中学', city: '上海', district: '徐汇' },
  { id: 's3', name: '实验外国语学校', city: '成都', district: '武侯' }
];

const MOCK_GUARDIANS = [
  { phone: '13800138000', student_id: '2024001', student_name: '李雷' }
];

interface GuardianStudent {
  studentId: string;
  name: string;
  grade: string;
  className: string;
}

interface StudentForm {
  name: string;
  studentNumber: string;
  schoolQuery: string;
  selectedSchoolId: string | null;
}

const MOCK_GUARDIAN_STUDENTS: Record<string, GuardianStudent[]> = {
  '13800138000': [
    { studentId: '2024001', name: '李雷', grade: '六年级', className: '1班' },
    { studentId: '2024002', name: '韩梅梅', grade: '七年级', className: '2班' }
  ]
};

const GRADES = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '七年级', '八年级', '九年级', '高一', '高二', '高三'];
const SECURITY_PRESETS = [
  '你的小学叫什么？',
  '你最喜欢的老师姓名？',
  '你最喜欢的科目？',
  '你童年时的昵称？',
  '你最喜欢的运动？'
];
const DEMO_NEW_PASSWORD = 'NewPass123';

const MOCK_SECURITY = {
  '2024001': {
    questions: [
      { q: '你最喜欢的科目？', a: '数学' },
      { q: '你最喜欢的运动？', a: '篮球' }
    ]
  },
  '2024002': {
    questions: [
      { q: '你的小学叫什么？', a: '育才小学' },
      { q: '你最喜欢的老师姓名？', a: '王老师' }
    ]
  },
  '2024003': {
    questions: [
      { q: '你童年时的昵称？', a: '小虎' },
      { q: '你最喜欢的科目？', a: '语文' }
    ]
  }
} as Record<
  string,
  {
    questions: { q: string; a: string }[];
  }
>;

const isValidPhone = (value: string) => /^1\d{10}$/.test(value);
const isValidPassword = (value: string) => /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,20}$/.test(value);

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const PHONE_FLOW_DEFAULTS = useMemo(
    () => ({
      phone: '13800138000',
      smsCode: '123456',
      studentName: '测试学生',
      studentNumber: '2024001',
      schoolQuery: '朝阳第一小学（北京）',
      selectedSchoolId: 's1',
      privacyChecked: true
    }),
    []
  );

  const [mode, setMode] = useState<Mode>('student');
  const [authView, setAuthView] = useState<AuthView>('login');
  const [authSubView, setAuthSubView] = useState<AuthSubView>('login');
  const [studentId, setStudentId] = useState('2024001');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [pwdFlow, setPwdFlow] = useState<PasswordFlow>(null);
  const [recoveryMethod, setRecoveryMethod] = useState<'security' | 'sms'>('security');
  const [recoveryStep, setRecoveryStep] = useState<1 | 2 | 3>(1);
  const [isRecoveryVerified, setIsRecoveryVerified] = useState(false);
  const [isForceChange, setIsForceChange] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | 3>(1);
  const [recoveryId, setRecoveryId] = useState('2024001');
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState(DEMO_NEW_PASSWORD);
  const [confirmPwd, setConfirmPwd] = useState(DEMO_NEW_PASSWORD);
  const [secQ1, setSecQ1] = useState(SECURITY_PRESETS[0]);
  const [secA1, setSecA1] = useState('');
  const [secQ2, setSecQ2] = useState(SECURITY_PRESETS[1]);
  const [secA2, setSecA2] = useState('');
  const [customQ1, setCustomQ1] = useState('');
  const [customQ2, setCustomQ2] = useState('');
  const [securityData, setSecurityData] = useState<{ questions: { q: string; a: string }[] } | null>(
    MOCK_SECURITY['2024001'] || null
  );

  // 预填便于演示（可按需修改或清空）
  const [phone, setPhone] = useState(PHONE_FLOW_DEFAULTS.phone);
  const [smsCode, setSmsCode] = useState(PHONE_FLOW_DEFAULTS.smsCode);
  const [smsCooldown, setSmsCooldown] = useState(0);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [phoneStep, setPhoneStep] = useState<1 | 2>(1);
  const [phoneAuthMode, setPhoneAuthMode] = useState<'code' | 'password'>('code');
  const [studentConfirmStep, setStudentConfirmStep] = useState<'fill' | 'confirm'>('fill');
  const [createdStudents, setCreatedStudents] = useState<GuardianStudent[]>([]);
  const [selectedCreatedStudentId, setSelectedCreatedStudentId] = useState<string | null>(null);
  const [existingStudentName, setExistingStudentName] = useState<string | null>(null);
  const [guardianStudents, setGuardianStudents] = useState<GuardianStudent[]>([]);
  const [selectedGuardianStudentId, setSelectedGuardianStudentId] = useState<string | null>(null);
  const [showPhonePassword, setShowPhonePassword] = useState(false);

  const [students, setStudents] = useState<StudentForm[]>([
    {
      name: PHONE_FLOW_DEFAULTS.studentName,
      studentNumber: PHONE_FLOW_DEFAULTS.studentNumber,
      schoolQuery: PHONE_FLOW_DEFAULTS.schoolQuery,
      selectedSchoolId: PHONE_FLOW_DEFAULTS.selectedSchoolId
    }
  ]);
  const [activeStudentIndex, setActiveStudentIndex] = useState(0);
  const [privacyChecked, setPrivacyChecked] = useState(PHONE_FLOW_DEFAULTS.privacyChecked);

  const [isLoading, setIsLoading] = useState(false);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!smsCooldown) return undefined;
    const timer = setInterval(() => {
      setSmsCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [smsCooldown]);

  const getSchoolById = (id: string | null) => MOCK_SCHOOLS.find((s) => s.id === id) || null;
  const getFilteredSchools = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return MOCK_SCHOOLS;
    return MOCK_SCHOOLS.filter((s) => `${s.name}${s.city}${s.district}`.toLowerCase().includes(trimmed.toLowerCase()));
  };

  const activeStudent = students[activeStudentIndex] || students[0];

  const selectedGuardianStudent = useMemo(
    () => guardianStudents.find((student) => student.studentId === selectedGuardianStudentId) || null,
    [guardianStudents, selectedGuardianStudentId]
  );

  const resetErrors = () => {
    setFieldErrors({});
    setBanner(null);
  };

  const backToLoginView = () => {
    setAuthSubView('login');
    setPwdFlow(null);
    setRecoveryMethod('security');
    setRecoveryId('2024001');
    setRecoveryStep(1);
    setIsRecoveryVerified(false);
    setOldPwd('');
    setNewPwd(DEMO_NEW_PASSWORD);
    setConfirmPwd(DEMO_NEW_PASSWORD);
    setSecQ1(SECURITY_PRESETS[0]);
    setSecQ2(SECURITY_PRESETS[1]);
    setSecA1('');
    setSecA2('');
    setCustomQ1('');
    setCustomQ2('');
    setSecurityData(MOCK_SECURITY['2024001'] || null);
    setIsLoading(false);
    setFieldErrors({});
    setBanner(null);
    setPhoneStep(1);
    setIsPhoneVerified(false);
    setExistingStudentName(null);
    resetGuardianSelection();
  };

  const resetPhoneFlow = () => {
    setPhone(PHONE_FLOW_DEFAULTS.phone);
    setSmsCode(PHONE_FLOW_DEFAULTS.smsCode);
    setSmsCooldown(0);
    setIsSendingCode(false);
    setIsPhoneVerified(false);
    setPhoneStep(1);
    setPhoneAuthMode('code');
    setStudentConfirmStep('fill');
    setCreatedStudents([]);
    setSelectedCreatedStudentId(null);
    setExistingStudentName(null);
    setStudents([
      {
        name: PHONE_FLOW_DEFAULTS.studentName,
        studentNumber: PHONE_FLOW_DEFAULTS.studentNumber,
        schoolQuery: PHONE_FLOW_DEFAULTS.schoolQuery,
        selectedSchoolId: PHONE_FLOW_DEFAULTS.selectedSchoolId
      }
    ]);
    setActiveStudentIndex(0);
    setPrivacyChecked(PHONE_FLOW_DEFAULTS.privacyChecked);
    setPwdFlow(null);
    setRecoveryMethod('security');
    setRecoveryId(PHONE_FLOW_DEFAULTS.phone);
    setRecoveryStep(1);
    setIsRecoveryVerified(false);
    setOldPwd('');
    setNewPwd(DEMO_NEW_PASSWORD);
    setConfirmPwd(DEMO_NEW_PASSWORD);
    setSecQ1(SECURITY_PRESETS[0]);
    setSecQ2(SECURITY_PRESETS[1]);
    setSecA1('');
    setSecA2('');
    setCustomQ1('');
    setCustomQ2('');
    setSecurityData(MOCK_SECURITY['2024001'] || null);
    resetGuardianSelection();
  };

  const resetGuardianSelection = () => {
    setGuardianStudents([]);
    setSelectedGuardianStudentId(null);
  };

  const updateStudent = (index: number, patch: Partial<StudentForm>) => {
    setStudents((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const addStudentCard = () => {
    setStudents((prev) => [
      ...prev,
      { name: '', studentNumber: '', schoolQuery: '', selectedSchoolId: null }
    ]);
    setActiveStudentIndex((prev) => prev + 1);
  };

  const removeStudentCard = (index: number) => {
    setStudents((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, i) => i !== index);
      setActiveStudentIndex((prevIdx) => Math.max(0, Math.min(prevIdx, next.length - 1)));
      return next;
    });
    // 可选：清理对应的字段错误
    setFieldErrors((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (key.startsWith(`student-${index}-`)) {
          delete next[key];
        }
      });
      return next;
    });
  };

  const renderGuardianChooser = (emptyMessage: string) =>
    guardianStudents.length > 0 ? (
      <div className="md:col-span-2 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm font-semibold text-white/80">选择孩子</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {guardianStudents.map((child) => {
            const isSelected = child.studentId === selectedGuardianStudentId;
            return (
              <button
                key={child.studentId}
                type="button"
                onClick={() => setSelectedGuardianStudentId(child.studentId)}
                className={`w-full rounded-2xl border px-3 py-3 text-left transition-colors ${
                  isSelected ? 'border-emerald-400 bg-emerald-500/10' : 'border-white/10 bg-white/5'
                }`}
              >
                <div className={`text-sm font-semibold ${isSelected ? 'text-emerald-200' : 'text-white'}`}>{child.name}</div>
                <div className="text-xs text-white/60">
                  {child.grade} · {child.className}
                </div>
              </button>
            );
          })}
        </div>
        {guardianStudents.length > 1 && !selectedGuardianStudentId && (
          <p className="text-xs text-red-300">请选择要登录的学生账号</p>
        )}
        {selectedGuardianStudent && (
          <p className="text-xs text-emerald-200">
            已选中学生：{selectedGuardianStudent.name}（{selectedGuardianStudent.grade} · {selectedGuardianStudent.className}）
          </p>
        )}
      </div>
    ) : null;

  const showPhoneAuthToggle = false;

  const loadGuardianStudentsByPhone = (phoneNumber: string) => {
    const trimmed = phoneNumber.trim();
    if (!trimmed) {
      resetGuardianSelection();
      return [];
    }
    const bindings = MOCK_GUARDIAN_STUDENTS[trimmed] || [];
    setGuardianStudents(bindings);
    setSelectedGuardianStudentId(bindings.length === 1 ? bindings[0].studentId : null);
    return bindings;
  };

  const handleSendCode = () => {
    resetErrors();
    if (!privacyChecked) {
      setBanner({ type: 'error', message: '请先勾选隐私政策与监护说明' });
      return;
    }
    if (!isValidPhone(phone)) {
      setFieldErrors({ phone: '请输入正确的家长手机号' });
      return;
    }
    if (smsCooldown > 0) return;

    setIsSendingCode(true);
    setTimeout(() => {
      setIsSendingCode(false);
      setSmsCooldown(60);
      setBanner({ type: 'success', message: '验证码已发送：123456（演示用）' });
    }, 800);
  };

  const handleStudentSubmit = () => {
    if (!studentId.trim() || !password.trim()) {
      setFieldErrors({
        studentId: !studentId.trim() ? '请输入学号' : '',
        password: !password.trim() ? '请输入密码' : ''
      });
      return;
    }
    const found = MOCK_STUDENTS.find(
      (s) => s.student_id === studentId.trim() && s.password === password.trim()
    );
    if (!found) {
      setBanner({ type: 'error', message: '学号或密码错误（示例错误码：INVALID_CREDENTIALS）' });
      return;
    }
    // 首次登录强制改密示例：默认密码视为初始密码
    const isDefaultPwd = found.password === '123456' || found.password === '654321';
    if (isDefaultPwd) {
      setIsForceChange(true);
      setAuthSubView('change');
      setPwdFlow('change');
      setRecoveryMethod('security');
      setRecoveryId(studentId.trim());
      setSecurityData(MOCK_SECURITY[studentId.trim()] || null);
      setRecoveryStep(1);
      setIsRecoveryVerified(false);
      setOnboardingStep(1);
      setBanner({ type: 'success', message: '首次登录需修改初始密码并设置安全问题' });
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setBanner({ type: 'success', message: `欢迎回来，${found.name}` });
      onLogin();
    }, 1000);
  };

  const handlePhoneVerify = () => {
    // 已验证场景：再次点击时，如果是登录并且需要孩子选择，则直接处理
    if (authView === 'login' && isPhoneVerified && guardianStudents.length > 0) {
      if (guardianStudents.length > 1 && !selectedGuardianStudentId) {
        setBanner({ type: 'error', message: '请选择要登录的学生账号' });
        return;
      }
      const target = selectedGuardianStudent || guardianStudents[0];
      setIsLoading(true);
      setBanner({ type: 'success', message: `已验证，正在登录 ${target.name}` });
      setTimeout(() => {
        setIsLoading(false);
        onLogin();
      }, 800);
      return;
    }

    const errors: Record<string, string> = {};
    if (!isValidPhone(phone)) errors.phone = '请输入正确的家长手机号';
    if (!privacyChecked) errors.privacy = '请勾选隐私政策与监护说明';
    if (!smsCode || smsCode.length !== 6) errors.smsCode = '请输入 6 位验证码';

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    if (smsCode !== '123456') {
      setBanner({ type: 'error', message: '验证码错误（示例错误码：SMS_EXPIRED）' });
      return;
    }

    setIsPhoneVerified(true);

    if (authSubView === 'reset') {
      const bound = loadGuardianStudentsByPhone(phone);
      if (bound.length > 1) {
        setBanner({ type: 'success', message: '手机号已验证，选择孩子后继续' });
        setPhoneStep(2);
        return;
      }
      if (bound.length === 1) {
        setBanner({ type: 'success', message: `已选中 ${bound[0].name}，可继续设置密码` });
        setPhoneStep(2);
        return;
      }
      setBanner({ type: 'success', message: '手机号已验证，请设置新密码' });
      setPhoneStep(2);
      return;
    }

    if (authView === 'login') {
      const bound = loadGuardianStudentsByPhone(phone);
      if (bound.length > 1) {
        setBanner({ type: 'success', message: '手机号已验证，请选择要登录的学生' });
        setPhoneStep(1);
        return;
      }
      if (bound.length === 1) {
        setBanner({ type: 'success', message: `已选中 ${bound[0].name}，直接登录` });
        setIsLoading(true);
        setTimeout(() => {
          setIsLoading(false);
          onLogin();
        }, 800);
        return;
      }
      setBanner({ type: 'success', message: '手机号已验证，未绑定学生，请填写学生信息后绑定' });
      setPhoneStep(2);
    } else {
      // 注册视图：统一进入资料填写
      setBanner({ type: 'success', message: '手机号已验证，请填写学生信息完成注册' });
      setPhoneStep(2);
    }
  };

  const handlePhoneBind = () => {
    const errors: Record<string, string> = {};
    if (!isPhoneVerified) errors.smsCode = '请先完成手机号验证码验证';

    const filledStudents = students
      .map((s, index) => ({ ...s, index }))
      .filter(
        (s) =>
          s.name.trim() ||
          s.studentNumber.trim() ||
          s.schoolQuery.trim() ||
          Boolean(s.selectedSchoolId)
      );

    if (!filledStudents.length) {
      errors.studentList = '请至少填写一位学生信息';
    }

    filledStudents.forEach((s) => {
      const keyPrefix = `student-${s.index}`;
      if (!s.name.trim()) errors[`${keyPrefix}-name`] = '请输入学生姓名';
      if (!s.studentNumber.trim()) errors[`${keyPrefix}-number`] = '请输入学号';
      if (!s.schoolQuery.trim() && !s.selectedSchoolId) errors[`${keyPrefix}-school`] = '请选择或填写学校';
    });

    if (Object.keys(errors).length) {
      const studentErrorKey = Object.keys(errors).find((k) => k.startsWith('student-'));
      if (studentErrorKey) {
        const idx = Number(studentErrorKey.split('-')[1]);
        if (!Number.isNaN(idx)) setActiveStudentIndex(idx);
      }
      setFieldErrors(errors);
      return;
    }

    const pendingCreated = filledStudents.map((s, idx) => ({
      studentId: s.studentNumber || `mock-${idx + 1}`,
      name: s.name,
      grade: '未填写年级',
      className: '未填写班级'
    }));
    setCreatedStudents(pendingCreated);
    setSelectedCreatedStudentId(pendingCreated[0]?.studentId || null);
    setStudentConfirmStep('confirm');
    setBanner({ type: 'success', message: `已创建 ${pendingCreated.length} 位学生，请选择要登录的账号` });
  };

  const handlePhonePasswordLogin = () => {
    const errors: Record<string, string> = {};
    if (!isValidPhone(phone)) errors.phone = '请输入正确的家长手机号';
    if (!privacyChecked) errors.privacy = '请勾选隐私政策与监护说明';
    if (!password.trim()) errors.password = '请输入密码';
    if (password && !isValidPassword(password)) errors.password = '密码需6-20位且含数字和字母';

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    const bound = guardianStudents.length ? guardianStudents : loadGuardianStudentsByPhone(phone);
    if (bound.length === 0) {
      setIsLoading(false);
      setBanner({ type: 'error', message: '该手机号未绑定学生，无法登录密码模式' });
      return;
    }
    if (bound.length > 1 && !selectedGuardianStudentId) {
      setIsLoading(false);
      setBanner({ type: 'success', message: '手机号已验证，请选择要登录的学生' });
      setPhoneStep(1);
      return;
    }
    const targetId = selectedGuardianStudentId || bound[0].studentId;
    const target = bound.find((b) => b.studentId === targetId) || bound[0];

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSelectedGuardianStudentId(target.studentId);
      setBanner({ type: 'success', message: `已选中 ${target.name}，直接登录` });
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        onLogin();
      }, 800);
    }, 400);
  };

  const handleConfirmStudentLogin = () => {
    const errors: Record<string, string> = {};
    if (!selectedCreatedStudentId) errors.createdStudent = '请选择要登录的学生账号';
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    const target =
      createdStudents.find((s) => s.studentId === selectedCreatedStudentId) || createdStudents[0];
    if (!target) {
      setBanner({ type: 'error', message: '未找到可登录的学生账号' });
      return;
    }
    setIsLoading(true);
    setBanner({ type: 'success', message: `正在登录 ${target.name}` });
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 800);
  };

  const validateNewPassword = (flow: 'reset' | 'change') => {
    const errors: Record<string, string> = {};
    if (!isValidPassword(newPwd)) errors.newPwd = '新密码需6-20位且含数字和字母';
    if (!confirmPwd.trim()) errors.confirmPwd = '请再次输入新密码';
    if (newPwd && confirmPwd && newPwd !== confirmPwd) errors.confirmPwd = '两次密码不一致';
    return errors;
  };

  const validateSecuritySetup = () => {
    const errors: Record<string, string> = {};
    if (!secQ1) errors.secQ1 = '请选择问题1';
    if (secQ1 === 'custom' && !customQ1.trim()) errors.secQ1 = '请填写自定义问题1';
    if (!secA1.trim()) errors.secA1 = '请输入答案1';
    if (!secQ2) errors.secQ2 = '请选择问题2';
    if (secQ2 === 'custom' && !customQ2.trim()) errors.secQ2 = '请填写自定义问题2';
    if (!secA2.trim()) errors.secA2 = '请输入答案2';
    if (secQ1 && secQ2 && secQ1 === secQ2 && secQ1 !== 'custom') errors.secQ2 = '请不要选择相同的问题';
    return errors;
  };

  const validateSecurity = () => {
    const errors: Record<string, string> = {};
    if (!recoveryId.trim()) errors.recoveryId = '请输入学号';
    if (isValidPhone(recoveryId.trim())) errors.recoveryId = '请输入学号进行安全问题验证';
    if (!securityData || securityData.questions.length < 2) errors.securityData = '未找到该学号的安全问题';
    if (!secA1.trim()) errors.secA1 = '请输入答案1';
    if (!secA2.trim()) errors.secA2 = '请输入答案2';
    return errors;
  };

  const ensureSmsVerified = () => {
    const errors: Record<string, string> = {};
    if (!isValidPhone(phone)) errors.phone = '请输入正确的家长手机号';
    if (!privacyChecked) errors.privacy = '请勾选隐私政策与监护说明';
    if (!smsCode || smsCode.length !== 6) errors.smsCode = '请输入 6 位验证码';
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return false;
    }
    if (smsCode !== '123456') {
      setBanner({ type: 'error', message: '验证码错误（示例错误码：SMS_EXPIRED）' });
      return false;
    }
    setIsPhoneVerified(true);
    return true;
  };

  const loadSecurityById = (id: string) => {
    const trimmed = id.trim();
    if (!trimmed || isValidPhone(trimmed)) {
      setSecurityData(null);
      return false;
    }
    const data = MOCK_SECURITY[trimmed];
    if (data) {
      setSecurityData(data);
      setSecA1(data.questions[0]?.a || '');
      setSecA2(data.questions[1]?.a || '');
      setBanner({ type: 'success', message: '已加载安全问题，请填写答案后设置新密码' });
      setFieldErrors((prev) => ({ ...prev, securityData: '', recoveryId: '' }));
      return true;
    }
    setSecurityData(null);
    setBanner({ type: 'error', message: '未找到该学号的安全问题，请联系老师或管理员' });
    return false;
  };

  const handleRecoveryIdentifyNext = () => {
    resetErrors();
    if (!recoveryId.trim()) {
      setFieldErrors({ recoveryId: '请输入学号或手机号' });
      return;
    }
    const trimmed = recoveryId.trim();
    setIsRecoveryVerified(false);
    resetGuardianSelection();
    if (isValidPhone(trimmed)) {
      const bound = loadGuardianStudentsByPhone(trimmed);
      setRecoveryMethod('sms');
      setPhone(trimmed);
      setRecoveryStep(2);
      const message =
        bound.length > 1
          ? '已选择短信验证，选择孩子后继续'
          : bound.length === 1
          ? `已选中学生 ${bound[0].name}，可继续验证`
          : '已选择短信验证，手机号暂未绑定学生';
      setBanner({ type: 'success', message });
      return;
    }
    setRecoveryMethod('security');
    const ok = loadSecurityById(trimmed);
    if (!ok) {
      setFieldErrors({ recoveryId: '未找到该学号的安全问题' });
      return;
    }
    setRecoveryStep(2);
    setBanner({ type: 'success', message: '已加载安全问题（演示已预填答案），请确认后继续' });
  };

  const handleRecoveryVerifyNext = () => {
    resetErrors();
    setIsLoading(true);
    if (recoveryMethod === 'security') {
      const errors = validateSecurity();
      if (securityData && securityData.questions.length >= 2) {
        const normalize = (v: string) => v.trim().toLowerCase();
        const ok1 = normalize(secA1) === normalize(securityData.questions[0].a);
        const ok2 = normalize(secA2) === normalize(securityData.questions[1].a);
        if (!ok1) errors.secA1 = '答案1不正确';
        if (!ok2) errors.secA2 = '答案2不正确';
      }
      if (Object.keys(errors).length) {
        setFieldErrors(errors);
        setIsLoading(false);
        return;
      }
      setIsRecoveryVerified(true);
      setRecoveryStep(3);
      setBanner({ type: 'success', message: '验证通过，请设置新密码' });
      setIsLoading(false);
      return;
    }
    const ok = ensureSmsVerified();
    if (!ok) {
      setIsLoading(false);
      return;
    }
    if (guardianStudents.length > 1 && !selectedGuardianStudentId) {
      setFieldErrors({ smsCode: '', recoveryId: '请选择要找回的学生' });
      setIsLoading(false);
      return;
    }
    setIsRecoveryVerified(true);
    setRecoveryStep(3);
    const smsSuccessMessage = selectedGuardianStudent
      ? `已验证学生 ${selectedGuardianStudent.name}，请设置新密码`
      : '验证码已通过，请设置新密码';
    setBanner({ type: 'success', message: smsSuccessMessage });
    setIsLoading(false);
  };

  const handleRecoveryPrev = () => {
    setRecoveryStep((prev) => Math.max(prev - 1, 1) as 1 | 2 | 3);
    setIsRecoveryVerified(false);
    resetGuardianSelection();
  };

  const handleForcePrev = () => {
    setBanner(null);
    setFieldErrors({});
    setOnboardingStep((prev) => Math.max(prev - 1, 1) as 1 | 2 | 3);
  };

  const handleForceNext = () => {
    resetErrors();
    if (onboardingStep === 1) {
      const errors = validateNewPassword('change');
      if (Object.keys(errors).length) {
        setFieldErrors(errors);
        return;
      }
      setOnboardingStep(2);
      setBanner({ type: 'success', message: '密码已设置，请继续设置密保问题' });
      return;
    }
    if (onboardingStep === 2) {
      const errors = validateSecuritySetup();
      if (Object.keys(errors).length) {
        setFieldErrors(errors);
        return;
      }
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setOnboardingStep(3);
        setBanner({ type: 'success', message: '密保已设置，进入学习空间' });
      }, 500);
    }
  };

  const handleForceComplete = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsForceChange(false);
      setOnboardingStep(1);
      setAuthSubView('login');
      setPwdFlow(null);
      setBanner(null);
      onLogin();
    }, 500);
  };

  const handlePasswordChangeFlow = (isResetFlow: boolean) => {
    if (!isRecoveryVerified) {
      setBanner({ type: 'error', message: '请先完成身份验证' });
      return;
    }
    const errors = validateNewPassword(isResetFlow ? 'reset' : 'change');

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const msg = isResetFlow ? '密码已重置，请使用新密码登录' : '密码修改成功';
      setBanner({ type: 'success', message: msg });
      setPwdFlow(null);
      setOldPwd('');
      setNewPwd(DEMO_NEW_PASSWORD);
      setConfirmPwd(DEMO_NEW_PASSWORD);
      setSecA1('');
      setSecA2('');
      setCustomQ1('');
      setCustomQ2('');
      setRecoveryId('2024001');
      setSecurityData(MOCK_SECURITY['2024001'] || null);
      setIsPhoneVerified(false);
      setSmsCode(PHONE_FLOW_DEFAULTS.smsCode);
      setSmsCooldown(0);
      setRecoveryStep(1);
      setIsRecoveryVerified(false);
      setAuthSubView('login');
      setMode('student');
      setAuthView('login');
      if (isForceChange) {
        setIsForceChange(false);
        onLogin();
      } else if (!isResetFlow) {
        // 修改密码后不强制登录，保持在登录视图
      }
    }, 800);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    resetErrors();

    if (mode === 'student') {
      handleStudentSubmit();
      return;
    }

    if (phoneAuthMode === 'password') {
      handlePhonePasswordLogin();
      return;
    }

    if (phoneStep === 1) {
      handlePhoneVerify();
    } else {
      if (studentConfirmStep === 'confirm') {
        handleConfirmStudentLogin();
        return;
      }
      if (pwdFlow === 'reset') {
        handlePasswordChangeFlow(true);
      } else {
        handlePhoneBind();
      }
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChange: (val: string) => void,
    placeholder: string,
    props?: React.InputHTMLAttributes<HTMLInputElement>,
    errorKey?: string
  ) => (
    <div className="space-y-2">
      <label className="text-[13px] font-semibold text-white/70 flex items-center gap-2">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        {...props}
        className={`w-full bg-white/10 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder:text-white/40 outline-none focus:border-white/40 transition-colors min-h-[52px] ${
          props?.className || ''
        }`}
      />
      {errorKey && fieldErrors[errorKey] && (
        <p className="text-xs text-red-300">{fieldErrors[errorKey]}</p>
      )}
    </div>
  );

  return (
    <div className="absolute inset-0 bg-[#0b1021] text-white overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(121,134,255,0.35),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.08),transparent_40%),radial-gradient(circle_at_50%_80%,rgba(38,199,189,0.18),transparent_40%)]" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(0deg, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '28px 28px'
          }}
        />
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-5xl space-y-6">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center justify-between gap-4 flex-wrap"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur -mx-1">
                  <InteractiveLumi
                    size="md"
                    variant="standard"
                    emotion="idle"
                    style={{
                      width: 59,
                      height: 50,
                      paddingTop: 0,
                      paddingBottom: 0,
                      marginLeft: 0,
                      marginRight: 0
                    }}
                  />
                </div>
                <div>
                  <p className="text-xs tracking-[0.25em] text-white/50">AI伴学V2.0</p>
                  <h1 className="text-2xl font-bold text-white">登录 / 注册</h1>
                </div>
              </div>
            </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.25)] relative overflow-hidden"
          >
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-white/5 blur-3xl rounded-full pointer-events-none" />
            <div className="relative z-10 flex flex-col gap-8">
              <div className="flex-1 space-y-6">
                {authSubView === 'login' ? (
                  <>
                    {authView !== 'register' ? (
                      <div className="bg-white/10 rounded-2xl p-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setBanner(null);
                            setMode('student');
                            setAuthView('login');
                            setIsLoading(false);
                            setPwdFlow(null);
                            setOldPwd('');
                            setNewPwd('');
                            setConfirmPwd('');
                          }}
                          className={`flex-1 h-14 rounded-xl text-base font-semibold transition-all ${
                            mode === 'student'
                              ? 'bg-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.2)] text-white'
                              : 'text-white/60'
                          }`}
                        >
                          学号登录
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setBanner(null);
                            setMode('phone');
                            setAuthView('login');
                            setPhoneStep(1);
                            setIsLoading(false);
                            setPwdFlow(null);
                            setOldPwd('');
                            setNewPwd('');
                            setConfirmPwd('');
                          }}
                          className={`flex-1 h-14 rounded-xl text-base font-semibold transition-all ${
                            mode === 'phone' && authView === 'login'
                              ? 'bg-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.2)] text-white'
                              : 'text-white/60'
                          }`}
                        >
                          手机号登录
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setBanner(null);
                            resetPhoneFlow();
                            setMode('phone');
                            setAuthView('login');
                            setIsLoading(false);
                            setPwdFlow(null);
                            setOldPwd('');
                            setNewPwd('');
                            setConfirmPwd('');
                          }}
                          className="text-white/80 hover:text-white text-sm font-semibold active:scale-95 px-3 py-2 rounded-xl bg-white/10 border border-white/10"
                        >
                          返回登录
                        </button>
                      </div>
                    )}

                    {mode === 'student' && (
                      <form className="space-y-4" onSubmit={handleSubmit}>
                        {renderInput(
                          '学号 / Student ID',
                          studentId,
                          setStudentId,
                          '请输入学号',
                          { inputMode: 'numeric', autoComplete: 'username' },
                          'studentId'
                        )}
                        <div className="space-y-2">
                          <label className="text-[13px] font-semibold text-white/70 flex items-center gap-2">
                            <Lock size={16} /> 密码 / Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="请输入密码"
                              autoComplete="current-password"
                              className="w-full bg-white/10 border border-white/10 rounded-2xl px-4 py-3.5 pr-12 text-white placeholder:text-white/40 outline-none focus:border-white/40 transition-colors min-h-[52px]"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((prev) => !prev)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 active:scale-95"
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                          {fieldErrors.password && <p className="text-xs text-red-300">{fieldErrors.password}</p>}
                          <div className="flex items-center justify-end text-[11px] text-white/50">
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setBanner(null);
                                  setFieldErrors({});
                                  setPwdFlow('change');
                                  setOldPwd('');
                                  setNewPwd(DEMO_NEW_PASSWORD);
                                  setConfirmPwd(DEMO_NEW_PASSWORD);
                                  setAuthSubView('change');
                                  setRecoveryMethod('security');
                                  setRecoveryId(studentId);
                                  setRecoveryStep(1);
                                  setIsRecoveryVerified(false);
                                }}
                                className="flex items-center gap-1 text-brand font-semibold active:scale-95"
                              >
                                <KeyRound size={12} />
                                <span>修改密码</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setBanner(null);
                                  resetPhoneFlow();
                                  setMode('phone');
                                  setAuthView('login');
                                  setPhoneStep(1);
                                  setIsLoading(false);
                                  setPwdFlow('reset');
                                  setAuthSubView('change');
                                  setRecoveryMethod('security');
                                  setRecoveryId('');
                                  setSecurityData(null);
                                  setRecoveryStep(1);
                                  setIsRecoveryVerified(false);
                                  setIsForceChange(false);
                                  setNewPwd(DEMO_NEW_PASSWORD);
                                  setConfirmPwd(DEMO_NEW_PASSWORD);
                                }}
                                className="flex items-center gap-1 text-white/70 hover:text-white font-semibold active:scale-95"
                              >
                              
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-brand text-white py-4 rounded-2xl text-lg font-bold active:scale-95 disabled:opacity-60 shadow-[0_14px_40px_rgba(0,0,0,0.25)] flex items-center justify-center gap-2 min-h-[56px]"
                          >
                            {isLoading ? (
                              <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>验证中</span>
                              </>
                            ) : (
                              <>
                                <span>进入学习空间</span>
                                <ArrowRight size={18} />
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setBanner(null);
                              setMode('phone');
                              setAuthView('register');
                              resetPhoneFlow();
                              setIsLoading(false);
                            }}
                            className="w-full min-h-[52px] rounded-2xl border border-white/20 bg-white/5 text-white/70 text-sm font-semibold hover:text-white hover:border-white/40 active:scale-95 transition-colors"
                          >
                            还没有账号？去注册
                          </button>
                        </div>
                      </form>
                    )}

                    {mode === 'phone' && (
                      <form className="space-y-4" onSubmit={handleSubmit}>
                        {showPhoneAuthToggle && (
                          <div className="inline-flex rounded-full bg-white/10 p-1 gap-1">
                            {(['code', 'password'] as const).map((modeKey) => {
                              const active = phoneAuthMode === modeKey;
                              return (
                                <button
                                  key={modeKey}
                                  type="button"
                                  onClick={() => {
                                    setPhoneAuthMode(modeKey);
                                    setPhoneStep(1);
                                    setFieldErrors({});
                                    setBanner(null);
                                    setIsPhoneVerified(false);
                                    resetGuardianSelection();
                                  }}
                                  className={`px-4 py-2 text-sm font-semibold rounded-full transition ${
                                    active ? 'bg-white/80 text-[#0b1021] shadow' : 'text-white/70'
                                  }`}
                                >
                                  {modeKey === 'code' ? '验证码登录' : '密码登录'}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {phoneAuthMode === 'code' && phoneStep === 1 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderInput(
                              '手机号',
                              phone,
                              (val) => {
                                setPhone(val);
                                setIsPhoneVerified(false);
                                setExistingStudentName(null);
                                resetGuardianSelection();
                              },
                              '请输入 11 位手机号',
                              { inputMode: 'tel', maxLength: 11, className: 'pr-32' },
                              'phone'
                            )}
                            <div className="space-y-2">
                              <label className="text-[13px] font-semibold text-white/70 flex items-center gap-2">验证码</label>
                              <div className="relative">
                                <input
                                  value={smsCode}
                                  onChange={(e) => setSmsCode(e.target.value)}
                                  placeholder="6 位数字"
                                  inputMode="numeric"
                                  maxLength={6}
                                  className="w-full bg-white/10 border border-white/10 rounded-2xl px-4 py-3.5 pr-32 text-white placeholder:text-white/40 outline-none focus:border-white/40 transition-colors min-h-[52px]"
                                />
                                <button
                                  type="button"
                                  onClick={handleSendCode}
                                  disabled={isSendingCode || smsCooldown > 0}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 text-white px-3 h-11 rounded-xl text-sm font-semibold active:scale-95 disabled:opacity-60"
                                >
                                  {smsCooldown > 0 ? `${smsCooldown}s` : '获取验证码'}
                                </button>
                              </div>
                              {fieldErrors.smsCode && <p className="text-xs text-red-300">{fieldErrors.smsCode}</p>}
                            </div>
                            <div className="md:col-span-2 flex flex-col gap-3 text-sm text-white/70">
                              <label className="flex items-center gap-2 active:scale-95">
                                <input
                                  type="checkbox"
                                  checked={privacyChecked}
                                  onChange={(e) => setPrivacyChecked(e.target.checked)}
                                  className="w-5 h-5 rounded border-white/30 bg-white/10 accent-brand"
                                />
                                <span>我已阅读并同意《隐私政策》《家长监护说明》</span>
                              </label>
                              {fieldErrors.privacy && <p className="text-xs text-red-300">{fieldErrors.privacy}</p>}
                            </div>
                            {renderGuardianChooser('该手机号尚未绑定孩子账号，仍可继续验证（示例）。')}
                          </div>
                        )}

                        {phoneAuthMode === 'password' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderInput(
                              '手机号',
                              phone,
                              (val) => {
                                setPhone(val);
                                setExistingStudentName(null);
                                resetGuardianSelection();
                              },
                              '请输入 11 位手机号',
                              { inputMode: 'tel', maxLength: 11 },
                              'phone'
                            )}
                            <div className="space-y-2">
                              <label className="text-[13px] font-semibold text-white/70 flex items-center gap-2">
                                <Lock size={16} /> 密码登录
                              </label>
                              <div className="relative">
                                <input
                                  type={showPhonePassword ? 'text' : 'password'}
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  placeholder="请输入密码"
                                  autoComplete="current-password"
                                  className="w-full bg-white/10 border border-white/10 rounded-2xl px-4 py-3.5 pr-12 text-white placeholder:text-white/40 outline-none focus:border-white/40 transition-colors min-h-[52px]"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPhonePassword((prev) => !prev)}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 active:scale-95"
                                >
                                  {showPhonePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                              </div>
                              {fieldErrors.password && <p className="text-xs text-red-300">{fieldErrors.password}</p>}
                            </div>
                            <div className="md:col-span-2 flex flex-col gap-3 text-sm text-white/70">
                              <label className="flex items-center gap-2 active:scale-95">
                                <input
                                  type="checkbox"
                                  checked={privacyChecked}
                                  onChange={(e) => setPrivacyChecked(e.target.checked)}
                                  className="w-5 h-5 rounded border-white/30 bg-white/10 accent-brand"
                                />
                                <span>我已阅读并同意《隐私政策》《家长监护说明》</span>
                              </label>
                              {fieldErrors.privacy && <p className="text-xs text-red-300">{fieldErrors.privacy}</p>}
                            </div>
                            {renderGuardianChooser('该手机号尚未绑定孩子账号，无法密码登录')}
                          </div>
                        )}

                        {phoneAuthMode === 'code' && phoneStep === 2 && studentConfirmStep === 'fill' && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-semibold text-white/80">学生信息</div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {students.map((_, idx) => (
                                <button
                                  key={`student-tab-${idx}`}
                                  type="button"
                                  onClick={() => setActiveStudentIndex(idx)}
                                  className={`rounded-xl px-3 py-2 text-sm border flex items-center gap-2 ${
                                    idx === activeStudentIndex
                                      ? 'border-white/40 bg-white/15 text-white'
                                      : 'border-white/15 bg-white/5 text-white/70'
                                  } active:scale-95 transition`}
                                >
                                  <span>学生 {idx + 1}</span>
                                  {students.length > 1 && (
                                    <span
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeStudentCard(idx);
                                      }}
                                      className="text-white/60 hover:text-red-300 text-xs leading-none"
                                    >
                                      ×
                                    </span>
                                  )}
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={addStudentCard}
                                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white active:scale-95"
                              >
                                <span className="text-lg leading-none">＋</span>
                                <span>添加学生</span>
                              </button>
                            </div>
                            {fieldErrors.studentList && <p className="text-xs text-red-300">{fieldErrors.studentList}</p>}
                            {activeStudent && (
                              <motion.div
                                key={`student-card-active-${activeStudentIndex}`}
                                layout
                                className="w-full rounded-2xl border border-white/20 bg-white/10 p-4 space-y-4"
                              >
                                <div className="flex items-center justify-between text-xs text-white/60">
                                  <span>学生卡片 {activeStudentIndex + 1}</span>
                                  {activeStudent.selectedSchoolId && (
                                    <span className="text-emerald-200">
                                      已选 · {getSchoolById(activeStudent.selectedSchoolId)?.name || '未选学校'}
                                    </span>
                                  )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {renderInput(
                                    '学生姓名',
                                    activeStudent.name,
                                    (val) => updateStudent(activeStudentIndex, { name: val }),
                                    '请输入学生姓名',
                                    { autoComplete: 'name' },
                                    `student-${activeStudentIndex}-name`
                                  )}
                                  {renderInput(
                                    '学号',
                                    activeStudent.studentNumber,
                                    (val) => updateStudent(activeStudentIndex, { studentNumber: val }),
                                    '请输入学号',
                                    { autoComplete: 'off' },
                                    `student-${activeStudentIndex}-number`
                                  )}
                                </div>

                                <div className="space-y-2">
                                  <label className="text-[13px] font-semibold text-white/70 flex items-center gap-2">
                                    <School size={16} /> 学校
                                  </label>
                                  <div className="relative">
                                    <input
                                      value={activeStudent.schoolQuery}
                                      onChange={(e) => {
                                        updateStudent(activeStudentIndex, { schoolQuery: e.target.value, selectedSchoolId: null });
                                      }}
                                      placeholder="搜索学校名称 / 城市，如“朝阳一小”"
                                      className="w-full bg-white/10 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder:text-white/40 outline-none focus:border-white/40 transition-colors min-h-[52px]"
                                    />
                                    {activeStudent.selectedSchoolId && (
                                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-emerald-200">
                                        已选 · {getSchoolById(activeStudent.selectedSchoolId)?.name}
                                      </span>
                                    )}
                                  </div>
                                  {fieldErrors[`student-${activeStudentIndex}-school`] && (
                                    <p className="text-xs text-red-300">{fieldErrors[`student-${activeStudentIndex}-school`]}</p>
                                  )}

                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                    {getFilteredSchools(activeStudent.schoolQuery).slice(0, 3).map((school) => (
                                      <button
                                        key={school.id}
                                        type="button"
                                        onClick={() => {
                                          updateStudent(activeStudentIndex, {
                                            selectedSchoolId: school.id,
                                            schoolQuery: `${school.name}（${school.city}）`
                                          });
                                        }}
                                        className={`h-12 rounded-xl border border-white/10 bg-white/5 px-3 text-left text-sm flex flex-col justify-center active:scale-95 ${
                                          activeStudent.selectedSchoolId === school.id ? 'border-white/40 bg-white/15' : ''
                                        }`}
                                      >
                                        <span className="font-semibold text-white">{school.name}</span>
                                        <span className="text-xs text-white/60">
                                          {school.city} · {school.district}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        )}

                        {phoneAuthMode === 'code' && phoneStep === 2 && studentConfirmStep === 'confirm' && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-semibold text-white/80">选择要登录的学生账号</div>
                              <button
                                type="button"
                                onClick={() => setStudentConfirmStep('fill')}
                                className="text-white/70 hover:text-white text-xs font-semibold active:scale-95 px-3 py-2 rounded-xl border border-white/10"
                              >
                                返回修改信息
                              </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {createdStudents.map((child) => {
                                const isSelected = child.studentId === selectedCreatedStudentId;
                                return (
                                  <button
                                    key={`created-${child.studentId}`}
                                    type="button"
                                    onClick={() => setSelectedCreatedStudentId(child.studentId)}
                                    className={`w-full rounded-2xl border px-3 py-3 text-left transition-colors ${
                                      isSelected ? 'border-emerald-400 bg-emerald-500/10' : 'border-white/10 bg-white/5'
                                    }`}
                                  >
                                    <div className={`text-sm font-semibold ${isSelected ? 'text-emerald-200' : 'text-white'}`}>
                                      {child.name}
                                    </div>
                                    <div className="text-xs text-white/60">
                                      {child.grade} · {child.className} · 学号 {child.studentId}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                            {fieldErrors.createdStudent && (
                              <p className="text-xs text-red-300">{fieldErrors.createdStudent}</p>
                            )}
                          </div>
                        )}

                        <div className="flex gap-3">
                          {phoneStep === 2 && studentConfirmStep === 'fill' && (
                            <button
                              type="button"
                              onClick={() => setPhoneStep(1)}
                              className="min-h-[52px] px-4 rounded-2xl border border-white/20 text-white text-sm font-semibold active:scale-95 flex items-center gap-2"
                            >
                              返回上一步
                            </button>
                          )}
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 bg-brand text-white py-4 rounded-2xl text-lg font-bold active:scale-95 disabled:opacity-60 shadow-[0_14px_40px_rgba(0,0,0,0.25)] flex items-center justify-center gap-2 min-h-[56px]"
                          >
                            {isLoading ? (
                              <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>
                                  {phoneStep === 1
                                    ? '验证中'
                                    : studentConfirmStep === 'fill'
                                    ? authView === 'register'
                                      ? '创建中'
                                      : '绑定中'
                                    : '登录中'}
                                </span>
                              </>
                            ) : (
                              <>
                                <span>
                                  {phoneStep === 1
                                    ? '验证并继续'
                                    : studentConfirmStep === 'fill'
                                    ? authView === 'register'
                                      ? '下一步：选择学生'
                                      : '下一步：选择学生'
                                    : '确认登录'}
                                </span>
                                <ArrowRight size={18} />
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    )}
                  </>
                ) : isForceChange ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-white/50">首登改密</p>
                        <h2 className="text-xl font-bold text-white">设置新密码与密保</h2>
                        <p className="text-sm text-white/70">完成后进入学习空间</p>
                      </div>
                     
                    </div>

                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <span className={onboardingStep >= 1 ? 'text-white font-semibold' : ''}>Step 1 设置新密码</span>
                      <span className="text-white/30">/</span>
                      <span className={onboardingStep >= 2 ? 'text-white font-semibold' : ''}>Step 2 设置密保</span>
                    </div>

                    {onboardingStep === 1 && (
                      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="text-xs text-white/60">为账号 {studentId} 设置新密码</div>
                        {renderInput(
                          '新密码（6-20位，含字母和数字）',
                          newPwd,
                          setNewPwd,
                          '请输入新密码',
                          { type: 'password' },
                          'newPwd'
                        )}
                        {renderInput('确认新密码', confirmPwd, setConfirmPwd, '请再次输入新密码', { type: 'password' }, 'confirmPwd')}
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={handleForceNext}
                            disabled={isLoading}
                            className="flex-1 bg-brand text-white py-4 rounded-2xl text-lg font-bold active:scale-95 disabled:opacity-60 shadow-[0_14px_40px_rgba(0,0,0,0.25)]"
                          >
                            {isLoading ? '提交中' : '下一步：密保'}
                          </button>
                        </div>
                      </div>
                    )}

                    {onboardingStep === 2 && (
                      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="text-xs text-white/60">设置两道密保问题，便于找回密码</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[13px] font-semibold text-white/70 flex items-center gap-2">问题1</label>
                            <select
                              value={secQ1}
                              onChange={(e) => setSecQ1(e.target.value)}
                              className="w-full appearance-none bg-white/10 border border-white/10 rounded-2xl px-4 py-3.5 text-white outline-none focus:border-white/40 transition-colors min-h-[52px]"
                            >
                              {SECURITY_PRESETS.map((q) => (
                                <option key={q} value={q} className="bg-[#0b1021]">
                                  {q}
                                </option>
                              ))}
                              <option value="custom" className="bg-[#0b1021]">
                                自定义问题
                              </option>
                            </select>
                            {secQ1 === 'custom' && (
                              <input
                                value={customQ1}
                                onChange={(e) => setCustomQ1(e.target.value)}
                                placeholder="请输入自定义问题1"
                                className="w-full bg-white/10 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder:text-white/40 outline-none focus:border-white/40 transition-colors min-h-[52px]"
                              />
                            )}
                            <input
                              value={secA1}
                              onChange={(e) => setSecA1(e.target.value)}
                              placeholder="答案1（不区分大小写）"
                              className="w-full bg-white/10 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder:text-white/40 outline-none focus:border-white/40 transition-colors min-h-[52px]"
                            />
                            {fieldErrors.secQ1 && <p className="text-xs text-red-300">{fieldErrors.secQ1}</p>}
                            {fieldErrors.secA1 && <p className="text-xs text-red-300">{fieldErrors.secA1}</p>}
                          </div>
                          <div className="space-y-2">
                            <label className="text-[13px] font-semibold text-white/70 flex items-center gap-2">问题2</label>
                            <select
                              value={secQ2}
                              onChange={(e) => setSecQ2(e.target.value)}
                              className="w-full appearance-none bg-white/10 border border-white/10 rounded-2xl px-4 py-3.5 text-white outline-none focus:border-white/40 transition-colors min-h-[52px]"
                            >
                              {SECURITY_PRESETS.map((q) => (
                                <option key={q} value={q} className="bg-[#0b1021]">
                                  {q}
                                </option>
                              ))}
                              <option value="custom" className="bg-[#0b1021]">
                                自定义问题
                              </option>
                            </select>
                            {secQ2 === 'custom' && (
                              <input
                                value={customQ2}
                                onChange={(e) => setCustomQ2(e.target.value)}
                                placeholder="请输入自定义问题2"
                                className="w-full bg-white/10 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder:text-white/40 outline-none focus:border-white/40 transition-colors min-h-[52px]"
                              />
                            )}
                            <input
                              value={secA2}
                              onChange={(e) => setSecA2(e.target.value)}
                              placeholder="答案2（不区分大小写）"
                              className="w-full bg-white/10 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder:text-white/40 outline-none focus:border-white/40 transition-colors min-h-[52px]"
                            />
                            {fieldErrors.secQ2 && <p className="text-xs text-red-300">{fieldErrors.secQ2}</p>}
                            {fieldErrors.secA2 && <p className="text-xs text-red-300">{fieldErrors.secA2}</p>}
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={handleForcePrev}
                            className="min-h-[48px] px-4 rounded-2xl border border-white/20 text-white text-sm font-semibold active:scale-95"
                          >
                            上一步
                          </button>
                          <button
                            type="button"
                            onClick={handleForceNext}
                            disabled={isLoading}
                            className="flex-1 bg-brand text-white py-4 rounded-2xl text-lg font-bold active:scale-95 disabled:opacity-60 shadow-[0_14px_40px_rgba(0,0,0,0.25)]"
                          >
                            {isLoading ? '提交中' : '确认'}
                          </button>
                        </div>
                      </div>
                    )}

                    {onboardingStep === 3 && (
                      <div className="space-y-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-emerald-50">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <CheckCircle2 size={16} />
                          <span>已完成首登密码与密保设置</span>
                        </div>
                        <p className="text-sm text-emerald-100">点击下方进入学习空间</p>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={handleForceComplete}
                            disabled={isLoading}
                            className="flex-1 bg-brand text-white py-4 rounded-2xl text-lg font-bold active:scale-95 disabled:opacity-60 shadow-[0_14px_40px_rgba(0,0,0,0.25)]"
                          >
                            {isLoading ? '进入中' : '进入学习空间'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-white/50">安全</p>
                        <h2 className="text-xl font-bold text-white">
                          {pwdFlow === 'reset' ? '找回 / 重置密码' : '修改密码'}
                        </h2>
                        <p className="text-sm text-white/70">
                          {pwdFlow === 'reset'
                            ? '输入学号或手机号，验证后设置新密码'
                            : isForceChange
                            ? '首次登录需修改初始密码并设置安全问题'
                            : '选择验证方式后设置新密码'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (isForceChange) return;
                          backToLoginView();
                        }}
                        disabled={isForceChange}
                        className={`text-white/80 hover:text-white text-sm font-semibold active:scale-95 px-3 py-2 rounded-xl bg-white/10 border border-white/10 ${
                          isForceChange ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        返回登录
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <span className={recoveryStep >= 1 ? 'text-white font-semibold' : ''}>Step 1 识别账号</span>
                      <span className="text-white/30">/</span>
                      <span className={recoveryStep >= 2 ? 'text-white font-semibold' : ''}>Step 2 验证身份</span>
                      <span className="text-white/30">/</span>
                      <span className={recoveryStep === 3 ? 'text-white font-semibold' : ''}>Step 3 设置新密码</span>
                    </div>

                    {recoveryStep === 1 && (
                      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                        {renderInput(
                          '学号或手机号',
                          recoveryId,
                          (val) => {
                            setRecoveryId(val);
                          },
                          '请输入学号或手机号',
                          { inputMode: 'text' },
                          'recoveryId'
                        )}
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={handleRecoveryIdentifyNext}
                            className="flex-1 bg-brand text-white py-4 rounded-2xl text-lg font-bold active:scale-95 shadow-[0_14px_40px_rgba(0,0,0,0.25)]"
                          >
                            继续
                          </button>
                        </div>
                      </div>
                    )}

                    {recoveryStep === 2 && (
                      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="bg-white/10 rounded-2xl p-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setRecoveryMethod('security');
                              if (recoveryId.trim()) loadSecurityById(recoveryId);
                              setFieldErrors({});
                              setIsRecoveryVerified(false);
                              resetGuardianSelection();
                            }}
                            className={`flex-1 h-12 rounded-xl text-sm font-semibold transition-all ${
                              recoveryMethod === 'security'
                                ? 'bg-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.2)] text-white'
                                : 'text-white/60'
                            }`}
                          >
                            安全问题
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRecoveryMethod('sms');
                              setFieldErrors({});
                            resetGuardianSelection();
                              setMode('phone');
                              setAuthView('login');
                              setPhone(recoveryId && isValidPhone(recoveryId) ? recoveryId : PHONE_FLOW_DEFAULTS.phone);
                              setIsRecoveryVerified(false);
                            }}
                            className={`flex-1 h-12 rounded-xl text-sm font-semibold transition-all ${
                              recoveryMethod === 'sms'
                                ? 'bg-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.2)] text-white'
                                : 'text-white/60'
                            }`}
                          >
                            短信验证码
                          </button>
                        </div>

                        {banner && (
                          <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`rounded-2xl px-4 py-3 text-sm flex items-center gap-2 ${
                              banner.type === 'success'
                                ? 'bg-emerald-500/15 text-emerald-100 border border-emerald-400/30'
                                : 'bg-red-500/10 text-red-100 border border-red-400/30'
                            }`}
                          >
                            {banner.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                            <span>{banner.message}</span>
                          </motion.div>
                        )}

                        {recoveryMethod === 'security' ? (
                          <div className="space-y-3">
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                              <div className="text-sm font-semibold text-white/80">安全问题验证</div>
                              <div className="space-y-2">
                                <label className="text-[13px] font-semibold text-white/70 flex items-center gap-2">
                                  问题1：{securityData?.questions?.[0]?.q || '未找到安全问题'}
                                </label>
                                <input
                                  value={secA1}
                                  onChange={(e) => setSecA1(e.target.value)}
                                  placeholder="请输入答案1（不区分大小写，演示用）"
                                  className="w-full bg-white/10 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder:text-white/40 outline-none focus:border-white/40 transition-colors min-h-[52px]"
                                />
                                {fieldErrors.secA1 && <p className="text-xs text-red-300">{fieldErrors.secA1}</p>}
                              </div>
                              <div className="space-y-2">
                                <label className="text-[13px] font-semibold text-white/70 flex items-center gap-2">
                                  问题2：{securityData?.questions?.[1]?.q || '未找到安全问题'}
                                </label>
                                <input
                                  value={secA2}
                                  onChange={(e) => setSecA2(e.target.value)}
                                  placeholder="请输入答案2（不区分大小写，演示用）"
                                  className="w-full bg-white/10 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder:text-white/40 outline-none focus:border-white/40 transition-colors min-h-[52px]"
                                />
                                {fieldErrors.secA2 && <p className="text-xs text-red-300">{fieldErrors.secA2}</p>}
                              </div>
                              {fieldErrors.securityData && <p className="text-xs text-red-300">{fieldErrors.securityData}</p>}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderInput(
                              '手机号',
                              phone,
                              (val) => {
                                setPhone(val);
                                setIsPhoneVerified(false);
                                setExistingStudentName(null);
                                resetGuardianSelection();
                              },
                              '请输入 11 位手机号',
                              { inputMode: 'tel', maxLength: 11, className: 'pr-32' },
                              'phone'
                            )}
                              <div className="space-y-2">
                                <label className="text-[13px] font-semibold text-white/70 flex items-center gap-2">验证码</label>
                                <div className="relative">
                                  <input
                                    value={smsCode}
                                    onChange={(e) => setSmsCode(e.target.value)}
                                    placeholder="6 位数字"
                                    inputMode="numeric"
                                    maxLength={6}
                                    className="w-full bg-white/10 border border-white/10 rounded-2xl px-4 py-3.5 pr-32 text-white placeholder:text-white/40 outline-none focus:border-white/40 transition-colors min-h-[52px]"
                                  />
                                  <button
                                    type="button"
                                    onClick={handleSendCode}
                                    disabled={isSendingCode || smsCooldown > 0}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 text-white px-3 h-11 rounded-xl text-sm font-semibold active:scale-95 disabled:opacity-60"
                                  >
                                    {smsCooldown > 0 ? `${smsCooldown}s` : '获取验证码'}
                                  </button>
                                </div>
                                {fieldErrors.smsCode && <p className="text-xs text-red-300">{fieldErrors.smsCode}</p>}
                              </div>
                            </div>
                            {guardianStudents.length > 0 ? (
                              <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                                <div className="text-sm font-semibold text-white/80">选择孩子</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {guardianStudents.map((child) => {
                                    const isSelected = child.studentId === selectedGuardianStudentId;
                                    return (
                                      <button
                                        key={child.studentId}
                                        type="button"
                                        onClick={() => setSelectedGuardianStudentId(child.studentId)}
                                        className={`w-full rounded-2xl border px-3 py-3 text-left transition-colors ${
                                          isSelected
                                            ? 'border-emerald-400 bg-emerald-500/10'
                                            : 'border-white/10 bg-white/5'
                                        }`}
                                      >
                                        <div className={`text-sm font-semibold ${isSelected ? 'text-emerald-200' : 'text-white'}`}>
                                          {child.name}
                                        </div>
                                        <div className="text-xs text-white/60">
                                          {child.grade} · {child.className}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                                {guardianStudents.length > 1 && !selectedGuardianStudentId && (
                                  <p className="text-xs text-red-300">请选择要找回的学生账号</p>
                                )}
                                {selectedGuardianStudent && (
                                  <p className="text-xs text-emerald-200">
                                    已选中学生：{selectedGuardianStudent.name}（{selectedGuardianStudent.grade} · {selectedGuardianStudent.className}）
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-amber-200">
                                该手机号尚未绑定孩子账号，仍可继续验证（示例）。
                              </p>
                            )}
                            <div className="flex flex-col gap-3 text-sm text-white/70">
                              <label className="flex items-center gap-2 active:scale-95">
                                <input
                                  type="checkbox"
                                  checked={privacyChecked}
                                  onChange={(e) => setPrivacyChecked(e.target.checked)}
                                  className="w-5 h-5 rounded border-white/30 bg-white/10 accent-brand"
                                />
                                <span>我已阅读并同意《隐私政策》《家长监护说明》</span>
                              </label>
                              {fieldErrors.privacy && <p className="text-xs text-red-300">{fieldErrors.privacy}</p>}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={handleRecoveryPrev}
                            className="min-h-[48px] px-4 rounded-2xl border border-white/20 text-white text-sm font-semibold active:scale-95"
                          >
                            上一步
                          </button>
                          <button
                            type="button"
                            onClick={handleRecoveryVerifyNext}
                            disabled={isLoading}
                            className="flex-1 bg-brand text-white py-3 rounded-2xl text-lg font-bold active:scale-95 shadow-[0_14px_40px_rgba(0,0,0,0.25)]"
                          >
                            {isLoading ? '验证中' : '验证并继续'}
                          </button>
                        </div>
                      </div>
                    )}

                    {recoveryStep === 3 && (
                      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="text-xs text-white/60">
                          账号 {recoveryId || (isValidPhone(phone) ? phone : '—')} ·{' '}
                          {recoveryMethod === 'security' ? '安全问题已通过' : '验证码已通过'}
                        </div>
                        <div className="space-y-4">
                          {renderInput(
                            '新密码（6-20位，含字母和数字）',
                            newPwd,
                            setNewPwd,
                            '请输入新密码',
                            { type: 'password' },
                            'newPwd'
                          )}
                          {renderInput('确认新密码', confirmPwd, setConfirmPwd, '请再次输入新密码', { type: 'password' }, 'confirmPwd')}
                        </div>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={handleRecoveryPrev}
                            className="min-h-[48px] px-4 rounded-2xl border border-white/20 text-white text-sm font-semibold active:scale-95"
                          >
                            上一步
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePasswordChangeFlow(pwdFlow === 'reset')}
                            disabled={isLoading}
                            className="flex-1 bg-brand text-white py-4 rounded-2xl text-lg font-bold active:scale-95 disabled:opacity-60 shadow-[0_14px_40px_rgba(0,0,0,0.25)]"
                          >
                            {isLoading ? '提交中' : pwdFlow === 'reset' ? '重置密码' : '确认修改'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
