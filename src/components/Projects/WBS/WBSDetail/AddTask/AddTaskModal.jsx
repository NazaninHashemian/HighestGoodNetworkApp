import React, { useState, useEffect, useRef } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Row, Col } from 'reactstrap';
import { connect } from 'react-redux';
import ReactTooltip from 'react-tooltip';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import { Editor } from '@tinymce/tinymce-react';
import dateFnsFormat from 'date-fns/format';
import { boxStyle, boxStyleDark } from 'styles';
import { useMemo } from 'react';
import { addNewTask } from '../../../../../actions/task';
import { DUE_DATE_MUST_GREATER_THAN_START_DATE } from '../../../../../languages/en/messages';
import 'react-day-picker/lib/style.css';
import '../../../../Header/DarkMode.css'
import TagsSearch from '../components/TagsSearch';

const TINY_MCE_INIT_OPTIONS = {
  license_key: 'gpl',
  menubar: false,
  plugins: 'advlist autolink autoresize lists link charmap table paste help',
  toolbar:
    'bold italic  underline numlist   |  removeformat link bullist  outdent indent |\
                    styleselect fontsizeselect | table| strikethrough forecolor backcolor |\
                    subscript superscript charmap  | help',
  branding: false,
  min_height: 180,
  max_height: 300,
  autoresize_bottom_margin: 1,
};

function AddTaskModal(props) {
  /*
  * -------------------------------- variable declarations -------------------------------- 
  */
  // props from store 
  const { tasks, copiedTask, allMembers, allProjects, error, darkMode } = props;

  // states from hooks
  const defaultCategory = useMemo(() => {
    if (props.taskId) {
      return tasks.find(({ _id }) => _id === props.taskId).category;
    } 
      return allProjects.projects.find(({ _id }) => _id === props.projectId).category;
      
  }, []);
  const [taskName, setTaskName] = useState('');
  const [priority, setPriority] = useState('Primary');
  const [resourceItems, setResourceItems] = useState([]);
  const [assigned, setAssigned] = useState(false);
  const [status, setStatus] = useState('Started');
  const [hoursBest, setHoursBest] = useState(0);
  const [hoursMost, setHoursMost] = useState(0);
  const [hoursWorst, setHoursWorst] = useState(0);
  const [hoursEstimate, setHoursEstimate] = useState(0);
  const [link, setLink] = useState('');
  const [links, setLinks] = useState([]);
  const [category, setCategory] = useState(defaultCategory);
  const [whyInfo, setWhyInfo] = useState('');
  const [intentInfo, setIntentInfo] = useState('');
  const [startedDate, setStartedDate] = useState('');
  const [endstateInfo, setEndstateInfo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [modal, setModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newTaskNum, setNewTaskNum] = useState('1');
  const [dateWarning, setDateWarning] = useState(false);
  const [hoursWarning, setHoursWarning] = useState(false);
  const priorityRef = useRef(null);

  const categoryOptions = [
    { value: 'Unspecified', label: 'Unspecified' },
    { value: 'Housing', label: 'Housing' },
    { value: 'Food', label: 'Food' },
    { value: 'Energy', label: 'Energy' },
    { value: 'Education', label: 'Education' },
    { value: 'Society', label: 'Society' },
    { value: 'Economics', label: 'Economics' },
    { value: 'Stewardship', label: 'Stewardship' },
    { value: 'Other', label: 'Other' },
  ];
  const FORMAT = 'MM/dd/yy';

  /*
  * -------------------------------- functions -------------------------------- 
  */
  const toggle = () => setModal(!modal);

  const openModal = () => {
    if (!props.isOpen && props.setIsOpen) props.setIsOpen(true);
    toggle();
  };

  const getNewNum = () => {
    let newNum;
    if (props.taskId) { 
      const numOfLastInnerLevelTask = tasks.reduce((num, task) => {
        if (task.mother === props.taskId) {
          const numIndexArray = task.num.split('.');
          const numOfInnerLevel = numIndexArray[props.level];
          num = +numOfInnerLevel > num ? +numOfInnerLevel : num;
        }
        return num;
      }, 0);
      const currentLevelIndexes = props.taskNum.replaceAll('.0', '').split('.');
      currentLevelIndexes[props.level] = `${numOfLastInnerLevelTask + 1}`;
      newNum = currentLevelIndexes.join('.');
    } else {
      const numOfLastLevelOneTask = tasks.reduce((num, task) => {
        if (task.level === 1) {
          const numIndexArray = task.num.split('.');
          const indexOfFirstNum = numIndexArray[0];
          num = +indexOfFirstNum > num ? +indexOfFirstNum : num;
        }
        return num;
      }, 0)
      newNum = `${numOfLastLevelOneTask + 1}`;
    }
    return newNum;
  };

  const removeResource = userID => {
    const newResource = resourceItems.filter(item => item.userID !== userID);
    setResourceItems(newResource);
    if (!newResource.length) setAssigned(false);
  };

  const addResources = (userID, first, last, profilePic) => {
    const newResource = [
      {
        userID,
        name: `${first} ${last}`,
        profilePic,
      },
      ...resourceItems,
    ]
    setResourceItems(newResource);
    setAssigned(true);
  };

  const formatDate = (date, format, locale) => dateFnsFormat(date, format, { locale });

  const calHoursEstimate = (isOn = null) => {
    let currHoursMost = parseInt(hoursMost);
    let currHoursWorst = parseInt(hoursWorst);
    const currHoursBest = parseInt(hoursBest);
    if (isOn !== 'hoursMost') {
      currHoursMost = Math.round((currHoursWorst - currHoursBest) / 2 + currHoursBest);
      setHoursMost(currHoursMost);
      if (isOn !== 'hoursWorst') {
        currHoursWorst = Math.round(currHoursBest * 2);
        setHoursWorst(currHoursWorst);
        currHoursMost = Math.round((currHoursWorst - currHoursBest) / 2 + currHoursBest);
        setHoursMost(currHoursMost);
      }
    }

    setHoursEstimate(parseInt((currHoursMost + currHoursBest + currHoursWorst) / 3));

    if (!(currHoursBest <= currHoursMost && currHoursMost <= currHoursWorst)) {
      setHoursWarning(true);
    } else {
      setHoursWarning(false);
    }
  };

  const changeDateStart = startDate => {
    setStartedDate(startDate);
    if (dueDate) {
      if (startDate > dueDate) {
        setDateWarning(true);
      } else {
        setDateWarning(false);
      }
    }
  };

  const changeDateEnd = dueDate => {
    setDueDate(dueDate);
    if (startedDate) {
      if (dueDate < startedDate) {
        setDateWarning(true);
      } else {
        setDateWarning(false);
      }
    }
  };

  const addLink = () => {
    setLinks([...links, link]);
    setLink('');
  };

  const removeLink = index => {
    setLinks([...links.slice(0, index), ...links.slice(index + 1)]);
  };

  const clear = () => {
    setTaskName('');
    setPriority('Primary');
    setResourceItems([]);
    setAssigned(false);
    setStatus('Started');
    setHoursBest(0);
    setHoursWorst(0);
    setHoursMost(0);
    setHoursEstimate(0);
    setStartedDate('');
    setDueDate('');
    setLinks([]);
    setWhyInfo('');
    setIntentInfo('');
    setEndstateInfo('');
    setCategory(defaultCategory);
  };

  const paste = () => {
    setTaskName(copiedTask.taskName)

    setPriority(copiedTask.priority);
    priorityRef.current.value = copiedTask.priority;

    setResourceItems(copiedTask.resources);
    setAssigned(copiedTask.isAssigned);
    setStatus(copiedTask.status);

    setHoursBest(copiedTask.hoursBest);
    setHoursWorst(copiedTask.hoursWorst);
    setHoursMost(copiedTask.hoursMost);
    setHoursEstimate(copiedTask.estimatedHours);

    setStartedDate(copiedTask.startedDatetime);
    setDueDate(copiedTask.dueDatetime);

    setLinks(copiedTask.links);
    setWhyInfo(copiedTask.whyInfo);
    setIntentInfo(copiedTask.intentInfo);
    setEndstateInfo(copiedTask.endstateInfo);
  };

  const addNewTask = async () => {
    setIsLoading(true);
    const newTask = {
      taskName,
      wbsId: props.wbsId,
      num: newTaskNum,
      level: props.taskId ? props.level + 1 : 1,
      priority,
      resources: resourceItems,
      isAssigned: assigned,
      status,
      hoursBest: parseFloat(hoursBest),
      hoursWorst: parseFloat(hoursWorst),
      hoursMost: parseFloat(hoursMost),
      estimatedHours: parseFloat(hoursEstimate),
      startedDatetime: startedDate,
      dueDatetime: dueDate,
      links,
      category,
      parentId1: props.level === 1 ? props.taskId : props.parentId1, 
      parentId2: props.level === 2 ? props.taskId : props.parentId2,
      parentId3: props.level === 3 ? props.taskId : props.parentId3,
      mother: props.taskId,
      position: 0, // it is required in database schema, didn't find its usage
      isActive: true,
      whyInfo,
      intentInfo,
      endstateInfo,
    };
    await props.addNewTask(newTask, props.wbsId, props.pageLoadTime);
    toggle();
    setIsLoading(false);
    props.load();
  };

  /*
  * -------------------------------- useEffects -------------------------------- 
  */
  useEffect(() => {
    setNewTaskNum(getNewNum());
  }, [modal]);

  useEffect(() => {
    ReactTooltip.rebuild();
  }, [links]);

  useEffect(() => {
    if (error === 'outdated') {
      alert('Database changed since your page loaded , click OK to get the newest data!');
      props.load();
    } else {
      clear();
    }
  }, [error, tasks])

  const fontColor = darkMode ? 'text-light' : '';

  return (
    <>
      <Modal isOpen={modal} toggle={toggle} className={darkMode ? 'text-light dark-mode' : ''}>
        <ModalHeader toggle={toggle} className={`w-100 align-items-center ${darkMode ? 'bg-space-cadet' : ''}`}>
          <ReactTooltip delayShow={300}/>
          <p className="fs-2 d-inline mr-3">Add New Task</p>
          <button
            type="button"
            size="small"
            className="btn btn-primary btn-sm ml-2"
            onClick={() => paste()}
            disabled={hoursWarning}
            style={darkMode ? boxStyleDark : boxStyle}
          >
            Paste
          </button>
          <button
            type="button"
            size="small"
            className="btn btn-danger btn-sm ml-2"
            onClick={() => clear()}
            style={darkMode ? boxStyleDark : boxStyle}
          >
            Reset
          </button>
        </ModalHeader>
        <ModalBody className={darkMode ? 'bg-yinmn-blue' : ''}>
          <div className="table table-bordered responsive">
            <div>
              <div className="m-0 border d-flex">
                <span className="border p-2 " data-tip="WBS ID" style={{width: "30%"}}>
                  WBS #
                </span>

                <span className="border-left flex-grow-1 p-2">{newTaskNum}</span>
              </div>
              <div className="m-0 border d-flex" >
                <span className="p-1" style={{width: "30%"}}>Task Name</span>
                <span className="border-left p-1 flex-grow-1">
                  {/* Fix Task-name formatting - by Sucheta */}
                  <textarea
                    type="text"
                    rows="2"
                    className="task-name border border-dark rounded"
                    onChange={e => setTaskName(e.target.value)}
                    onKeyPress={e => setTaskName(e.target.value)}
                    value={taskName}
                  />
                </span>
              </div >
              <div className='m-0 border d-flex'>
                <span className="p-1" style={{width: "30%"}} >Priority</span>
                <span className='border-left p-1 flex-grow-1'>
                  <select id="priority" onChange={e => setPriority(e.target.value)} ref={priorityRef}>
                    <option value="Primary">Primary</option>
                    <option value="Secondary">Secondary</option>
                    <option value="Tertiary">Tertiary</option>
                  </select>
                </span>
              </div>
              <div className="m-0 border d-flex align-items-center">
                <span className="p-1" style={{width: "30%"}}>Resources</span>
                <span className="border-left p-1" style={{width: "70%"}}>
                    <TagsSearch
                      placeholder="Add resources"
                      members={allMembers.filter(user=>user.isActive)}
                      addResources={addResources}
                      removeResource={removeResource}
                      resourceItems={resourceItems}
                      disableInput={false}
                    />
                  
                </span>
              </div>
              <div className="m-0 border d-flex">
                <span className="p-1" style={{width: "30%"}}>Assigned</span>
                <span className="border-left p-1">
                  <div className="flex-row d-inline align-items-center" >
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="radio"
                        id="true"
                        name="Assigned"
                        value={true}
                        checked={assigned}
                        onChange={() => setAssigned(true)}
                      />
                      <label className={`form-check-label ${fontColor}`} htmlFor="true">
                        Yes
                      </label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="radio"
                        id="false"
                        name="Assigned"
                        value={false}
                        checked={!assigned}
                        onChange={() => setAssigned(false)}
                      />
                      <label className={`form-check-label ${fontColor}`} htmlFor="false">
                        No
                      </label>
                    </div>
                  </div>
                </span>
              </div>
              <div className="m-0 d-flex border">
                <span className= "p-1" style={{width: "30%"}}>Status</span>
                <span className="p-1 border-left" style={{width: "70%"}}>
                 <div className="d-flex align-items-center"> 
                  <span className="form-check form-check-inline mr-5">
                      <input
                        className="form-check-input"
                        type="radio"
                        id="active"
                        name="status"
                        value="Active"
                        checked={status === 'Active' || status === 'Started'}
                        onChange={(e) => setStatus(e.target.value)}
                      />
                      <label className={`form-check-label ${fontColor}`} htmlFor="active">
                        Active
                      </label>
                    </span>
                  <span className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        id="notStarted"
                        name="status"
                        value="Not Started"
                        checked={status === 'Not Started'}
                        onChange={(e) => setStatus(e.target.value)}
                      />
                      <label className={`form-check-label ${fontColor}`} htmlFor="notStarted">
                        Not Started
                      </label>
                  </span>
                 </div>
                 <div className="d-flex align-items-center">
                  <span className="form-check form-check-inline mr-5">
                        <input
                          className="form-check-input"
                          type="radio"
                          id="paused"
                          name="status"
                          value="Paused"
                          checked={status === 'Paused'}
                          onChange={(e) => setStatus(e.target.value)}
                        />
                        <label className="form-check-label" htmlFor="paused">
                          Paused
                        </label>
                    
                  </span>
                  <span className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="radio"
                        id="complete"
                        name="status"
                        value="Complete"
                        checked={status === 'Complete'}
                        onChange={(e) => setStatus(e.target.value)}
                      />
                      <label className={`form-check-label ${fontColor}`} htmlFor="complete">
                        Complete
                      </label>
                   
                  </span>
                 </div>
                </span>
              </div>
              <div className="d-flex">
                <span className="p-1" style={{width: "30%"}}>
                  Hours
                </span>
                <span className="p-1 border-left" style={{width: "70%"}}>
                  <div className="py-2 flex-responsive">
                    <label htmlFor="bestCase" className="text-nowrap mr-3 w-25 mr-auto" style={{ fontWeight: 'normal' }}>
                      Best-case
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="500"
                      value={hoursBest}
                      onChange={e => setHoursBest(e.target.value)}
                      onBlur={() => calHoursEstimate()}
                      id="bestCase"
                      className="w-50 ml-2"
                    />
                    <div className="warning">
                      {hoursWarning
                        ? 'Hours - Best-case < Hours - Most-case < Hours - Most-case'
                        : ''}
                    </div>
                  </div>
                  <div className="py-2 flex-responsive">
                    <label htmlFor="worstCase" className={`text-nowrap mr-2 w-25 mr-auto ${fontColor}`} style={{ fontWeight: 'normal' }}>
                      Worst-case
                    </label>
                    <input
                      type="number"
                      min={hoursBest}
                      max="500"
                      value={hoursWorst}
                      onChange={e => setHoursWorst(e.target.value)}
                      onBlur={() => calHoursEstimate('hoursWorst')}
                      className="w-50 ml-2"
                    />
                    <div className="warning">
                      {hoursWarning
                        ? 'Hours - Best-case < Hours - Most-case < Hours - Most-case'
                        : ''}
                    </div>
                  </div>
                  <div className="py-2 flex-responsive">
                    <label htmlFor="mostCase" className={`text-nowrap mr-2 w-25 mr-auto ${fontColor}`} style={{ fontWeight: 'normal' }}>
                      Most-case
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="500"
                      value={hoursMost}
                      onChange={e => setHoursMost(e.target.value)}
                      onBlur={() => calHoursEstimate('hoursMost')}
                      className="w-50 ml-2"
                    />
                    <div className="warning">
                      {hoursWarning
                        ? 'Hours - Best-case < Hours - Most-case < Hours - Most-case'
                        : ''}
                    </div>
                  </div>
                  <div className="py-2 flex-responsive">
                    <label htmlFor="Estimated" className={`text-nowrap mr-2 w-25 mr-auto ${fontColor}`} style={{ fontWeight: 'normal' }}>
                      Estimated
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="500"
                      value={hoursEstimate}
                      onChange={e => setHoursEstimate(e.target.value)}
                      className="w-50 ml-2"
                    />
                  </div>
                </span>
              </div>
              <div className="d-flex border" >
                <span className="p-1" style={{width: "30%"}}>Links</span>
                <span className="p-1 border-left" style={{width: "70%"}}>
                  <div className="d-flex flex-row">
                    <input
                      type="text"
                      aria-label="Search user"
                      placeholder="Link"
                      className="task-resouces-input"
                      data-tip="Add a link"
                      onChange={e => setLink(e.target.value)}
                      value={link}
                    />
                    <button
                      className="task-resouces-btn"
                      type="button"
                      data-tip="Add Link"
                      onClick={addLink}
                    >
                      <i className={`fa fa-plus ${fontColor}`} aria-hidden="true" />
                    </button>
                  </div>
                  <div>
                    {links.map((link, i) =>
                      link.length > 1 ? (
                        <div key={i}>
                          <i className="fa fa-trash-o remove-link" aria-hidden="true" data-tip='delete' onClick={() => removeLink(i)}  />
                          <a href={link} className="task-link" target="_blank" rel="noreferrer">
                            {link}
                          </a>
                        </div>
                      ) : null,
                    )}
                  </div>
                </span>
              </div>
              <div className="d-flex border">
                <span  className= "p-1" style={{width: "30%"}}>Category</span>
                <span  className="p-1 border-left" style={{width: "70%"}}>
                  <select value={category} onChange={e => setCategory(e.target.value)}>
                    {categoryOptions.map(cla => (
                      <option value={cla.value} key={cla.value}>
                        {cla.label}
                      </option>
                    ))}
                  </select>
                </span>
              </div>
              <tr className='w-100'>
                <td scope="col" colSpan="3">
                  Why this Task is Important
                  <Editor
                    tinymceScriptSrc="/tinymce/tinymce.min.js"
                    licenseKey="gpl"
                    init={TINY_MCE_INIT_OPTIONS}
                    name="why-info"
                    className="why-info form-control"
                    value={whyInfo}
                    onEditorChange={content => setWhyInfo(content)}
                  />
                </td>
              </tr>
              <tr>
                <td scope="col" colSpan="2">
                  Design Intent
                  <Editor
                    tinymceScriptSrc="/tinymce/tinymce.min.js"
                    licenseKey="gpl"
                    init={TINY_MCE_INIT_OPTIONS}
                    name="intent-info"
                    className="intent-info form-control"
                    value={intentInfo}
                    onEditorChange={content => setIntentInfo(content)}
                  />
                </td>
              </tr>
              <tr>
                <td scope="col" colSpan="2">
                  Endstate
                  <Editor
                    tinymceScriptSrc="/tinymce/tinymce.min.js"
                    licenseKey="gpl"
                    init={TINY_MCE_INIT_OPTIONS}
                    name="endstate-info"
                    className="endstate-info form-control"
                    value={endstateInfo}
                    onEditorChange={content => setEndstateInfo(content)}
                  />
                </td>
              </tr>
              <tr>
                <td scope="col">Start Date</td>
                <td scope="col">
                  <div>
                    <DayPickerInput
                      format={FORMAT}
                      formatDate={formatDate}
                      placeholder={`${dateFnsFormat(new Date(), FORMAT)}`}
                      onDayChange={(day, mod, input) => changeDateStart(input.state.value)}
                      value={startedDate}
                    />
                    <div className="warning">
                      {dateWarning ? DUE_DATE_MUST_GREATER_THAN_START_DATE : ''}
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td scope="col">End Date</td>
                <td scope="col">
                  <DayPickerInput
                    format={FORMAT}
                    formatDate={formatDate}
                    placeholder={`${dateFnsFormat(new Date(), FORMAT)}`}
                    onDayChange={(day, mod, input) => changeDateEnd(input.state.value)}
                    value={dueDate}
                  />
                  <div className="warning">
                    {dateWarning ? DUE_DATE_MUST_GREATER_THAN_START_DATE : ''}
                  </div>
                </td>
              </tr>
            </div>
          </div>
        </ModalBody>
        <ModalFooter className={darkMode ? 'bg-yinmn-blue' : ''}>
          <Button color="primary" onClick={addNewTask} disabled={taskName === '' || hoursWarning || isLoading} style={darkMode ? boxStyleDark : boxStyle}>
            {isLoading ? "Adding Task..." : "Save"}
          </Button>
        </ModalFooter>
      </Modal>
      <Button color="primary" className="controlBtn" size="sm" onClick={openModal} style={darkMode ? boxStyleDark : boxStyle}>
        Add Task
      </Button>
    </>
  );
}

const mapStateToProps = state => ({ 
  tasks: state.tasks.taskItems,
  copiedTask: state.tasks.copiedTask,
  allMembers: state.projectMembers.members,
  allProjects: state.allProjects,
  error: state.tasks.error,
  darkMode: state.theme.darkMode,
 });
export default connect(mapStateToProps, { addNewTask })(AddTaskModal);
